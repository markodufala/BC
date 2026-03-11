import sys
import bpy


def main():
  # Blender passes its own args first; everything after "--" is ours.
  if "--" not in sys.argv:
    print("[PerformanceSync] No JSON path provided to bootstrap script")
    return

  json_path_index = sys.argv.index("--") + 1
  if json_path_index >= len(sys.argv):
    print("[PerformanceSync] Missing JSON path argument after '--'")
    return

  json_path = sys.argv[json_path_index]
  print(f"[PerformanceSync] Importing JSON into Blender: {json_path}")

  # Use the existing addon operator if the addon is enabled.
  try:
    bpy.ops.psync.import_json('EXEC_DEFAULT', filepath=json_path)
  except Exception as exc:  # noqa: BLE001
    print(f"[PerformanceSync] Failed to run psync.import_json: {exc}")


if __name__ == "__main__":
  main()

