(() => {
  "use strict";

  const API_URL = "https://api.github.com/repos/chiassonba/fplearningwebsite/git/trees/main?recursive=1";
  const FILE_PREFIX = "files/FPLFiles/";
  const treeElement = document.getElementById("file-tree");
  const statusElement = document.getElementById("library-status");
  const refreshButton = document.getElementById("refresh-files");

  function makeFolder(name) {
    return { name, folders: new Map(), files: [] };
  }

  function fileCount(folder) {
    let total = folder.files.length;
    for (const child of folder.folders.values()) {
      total += fileCount(child);
    }
    return total;
  }

  function fileSize(bytes) {
    if (typeof bytes !== "number") return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KiB";
    return (bytes / 1048576).toFixed(1) + " MiB";
  }

  function sortByName(first, second) {
    return first.name.localeCompare(second.name, undefined, { numeric: true, sensitivity: "base" });
  }

  function renderFile(file) {
    const row = document.createElement("li");
    row.className = "file-row";

    const info = document.createElement("span");
    info.className = "file-info";
    const name = document.createElement("span");
    name.className = "filename";
    name.textContent = file.name;
    const metadata = document.createElement("span");
    metadata.className = "file-meta";
    const extension = file.name.includes(".") ? file.name.split(".").pop().toUpperCase() : "FILE";
    metadata.textContent = [extension, fileSize(file.size)].filter(Boolean).join(" · ");
    info.append(name, metadata);

    const action = document.createElement("a");
    action.href = "/" + file.path.split("/").map(encodeURIComponent).join("/");
    const lowerName = file.name.toLowerCase();
    const isWebApp = lowerName.endsWith(".html") || lowerName.endsWith(".htm");
    action.textContent = isWebApp ? "Open app" : "Download";
    if (isWebApp) {
      action.target = "_blank";
      action.rel = "noopener noreferrer";
    } else {
      action.download = file.name;
    }
    row.append(info, action);
    return row;
  }

  function renderFolder(folder, depth) {
    const details = document.createElement("details");
    details.className = "folder";
    details.open = depth === 0 && folder.name.toLowerCase() === "brand";

    const summary = document.createElement("summary");
    const name = document.createElement("span");
    name.className = "folder-name";
    name.textContent = folder.name;
    const count = document.createElement("span");
    count.className = "folder-meta";
    const total = fileCount(folder);
    count.textContent = total + (total === 1 ? " file" : " files");
    summary.append(name, count);

    const contents = document.createElement("div");
    contents.className = "folder-contents";
    renderContents(folder, contents, depth + 1);
    details.append(summary, contents);
    return details;
  }

  function renderContents(folder, container, depth) {
    for (const child of [...folder.folders.values()].sort(sortByName)) {
      container.append(renderFolder(child, depth));
    }
    if (folder.files.length) {
      const list = document.createElement("ul");
      list.className = "file-list";
      for (const file of folder.files.sort(sortByName)) {
        list.append(renderFile(file));
      }
      container.append(list);
    }
  }

  function buildTree(entries) {
    const root = makeFolder("");
    for (const entry of entries) {
      if (entry.type !== "blob" || !entry.path.startsWith(FILE_PREFIX)) continue;
      const segments = entry.path.slice(FILE_PREFIX.length).split("/");
      if (segments.some(segment => !segment || segment.startsWith("."))) continue;
      let current = root;
      for (const segment of segments.slice(0, -1)) {
        if (!current.folders.has(segment)) {
          current.folders.set(segment, makeFolder(segment));
        }
        current = current.folders.get(segment);
      }
      current.files.push({ name: segments[segments.length - 1], path: entry.path, size: entry.size });
    }
    return root;
  }

  async function refreshLibrary() {
    refreshButton.disabled = true;
    treeElement.setAttribute("aria-busy", "true");
    statusElement.textContent = "Checking the current folder listing…";
    try {
      const response = await fetch(API_URL, {
        cache: "no-store",
        headers: { Accept: "application/vnd.github+json" }
      });
      if (!response.ok) throw new Error("GitHub returned HTTP " + response.status);
      const result = await response.json();
      if (!Array.isArray(result.tree) || result.truncated) {
        throw new Error("The repository tree was unavailable or incomplete.");
      }

      const root = buildTree(result.tree);
      const contents = document.createDocumentFragment();
      renderContents(root, contents, 0);
      if (!contents.hasChildNodes()) {
        const empty = document.createElement("p");
        empty.className = "empty";
        empty.textContent = "No files have been published in the library yet.";
        contents.append(empty);
      }
      treeElement.replaceChildren(contents);
      const total = fileCount(root);
      statusElement.textContent = total + (total === 1 ? " file" : " files") + " available · Listing updated.";
    } catch (error) {
      // Keep the existing listing, including the static brand fallback.
      console.warn("FPL file library listing could not be refreshed:", error);
      statusElement.textContent = "Could not refresh. Showing the last available listing.";
    } finally {
      treeElement.setAttribute("aria-busy", "false");
      refreshButton.disabled = false;
    }
  }

  refreshButton.addEventListener("click", refreshLibrary);
  refreshLibrary();
})();
