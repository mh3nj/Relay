/**
 * Feature-detected wrapper around the File System Access API. Where
 * supported (Chromium-based browsers), this lets the user pick a real
 * folder on disk, e.g. their Google Drive or Dropbox desktop sync
 * folder, and Relay writes the backup file straight into it.
 * That folder's sync client (not this app) is what actually gets the
 * file to the cloud, so no backend or account is ever involved here.
 */

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}

interface FileSystemAccessWindow extends Window {
  showSaveFilePicker: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
}

export async function saveJsonToSyncedFolder(
  data: unknown,
  suggestedName: string
): Promise<"saved" | "cancelled"> {
  if (!isFileSystemAccessSupported()) {
    throw new Error("File System Access API is not supported in this browser.");
  }

  const win = window as unknown as FileSystemAccessWindow;
  let handle: FileSystemFileHandle;
  try {
    handle = await win.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: "JSON backup",
          accept: { "application/json": [".json"] },
        },
      ],
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return "cancelled";
    }
    throw err;
  }

  const writable = await handle.createWritable();
  await writable.write(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  await writable.close();
  return "saved";
}
