#!/usr/bin/env python3
"""Validate technical properties of a Motion OS Remotion preview.

This is a TECHNICAL quality gate, not a replacement for visual review,
storyboard approval, licensed-asset verification or final marketing QA.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys


def inspect_video(path: Path, quality: str) -> dict:
    if quality not in ("review", "draft"):
        raise ValueError("Quality must be review or draft")
    if not path.is_file():
        raise FileNotFoundError(path)
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    info = json.loads(result.stdout)
    video = next((stream for stream in info.get("streams", []) if stream.get("codec_type") == "video"), None)
    if video is None:
        raise ValueError("Missing video stream")

    expected_width, expected_height = (1080, 1920) if quality == "review" else (540, 960)
    width = int(video["width"])
    height = int(video["height"])
    fps = video.get("avg_frame_rate", "0/1")
    numerator, denominator = (int(x) for x in fps.split("/"))
    duration = float(info["format"]["duration"])
    if (width, height) != (expected_width, expected_height):
        raise ValueError(f"Wrong dimensions: {width}x{height}, expected {expected_width}x{expected_height}")
    if denominator == 0 or numerator / denominator != 30:
        raise ValueError(f"Unexpected fps: {fps}")
    if not 14.7 <= duration <= 15.3:
        raise ValueError(f"Unexpected duration: {duration:.4f}")
    if path.stat().st_size < 30_000:
        raise ValueError("Video is unexpectedly small")

    sha256 = hashlib.file_digest(path.open("rb"), "sha256").hexdigest()
    return {
        "schema_version": "motion-qa.v1",
        "job_id": "poc001",
        "composition": "MotionOsStoryboard",
        "status": "TECHNICAL_PREVIEW_ONLY",
        "passed": True,
        "quality": quality,
        "width": width,
        "height": height,
        "fps": numerator / denominator,
        "duration_seconds": duration,
        "video_sha256": sha256,
        "video_size_bytes": path.stat().st_size,
        "storyboard_approved": False,
        "brand_assets_verified": False,
        "creative_qa_approved": False,
        "not_for_publication": True,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify Motion OS preview using FFprobe")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--quality", choices=("draft", "review"), required=True)
    args = parser.parse_args()
    try:
        report = inspect_video(args.input, args.quality)
    except (OSError, ValueError, KeyError, subprocess.CalledProcessError) as exc:
        print(f"Motion OS validation failed: {exc}", file=sys.stderr)
        return 1
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Valid technical preview: {report['width']}x{report['height']}, {report['fps']} fps, {report['duration_seconds']:.2f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
