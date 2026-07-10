(function () {
  "use strict";

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const fileListEl = document.getElementById("file-list");
  const mergeBtn = document.getElementById("merge-btn");
  const clearBtn = document.getElementById("clear-btn");
  const statusEl = document.getElementById("status");

  /** @type {{id: number, file: File}[]} */
  let files = [];
  let nextId = 1;

  function setStatus(message, type) {
    statusEl.textContent = message || "";
    statusEl.classList.remove("error", "success");
    if (type) statusEl.classList.add(type);
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function addFiles(fileListInput) {
    const incoming = Array.from(fileListInput).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    const rejected = fileListInput.length - incoming.length;

    incoming.forEach((file) => {
      files.push({ id: nextId++, file });
    });

    if (rejected > 0) {
      setStatus(`Skipped ${rejected} file(s) that are not PDFs.`, "error");
    } else {
      setStatus("");
    }

    render();
  }

  function removeFile(id) {
    files = files.filter((f) => f.id !== id);
    render();
  }

  function moveFile(id, direction) {
    const index = files.findIndex((f) => f.id === id);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= files.length) return;
    const [item] = files.splice(index, 1);
    files.splice(newIndex, 0, item);
    render();
  }

  function render() {
    fileListEl.innerHTML = "";

    files.forEach((entry, index) => {
      const li = document.createElement("li");

      const name = document.createElement("span");
      name.className = "file-name";
      name.textContent = entry.file.name;
      name.title = entry.file.name;

      const size = document.createElement("span");
      size.className = "file-size";
      size.textContent = formatSize(entry.file.size);

      const reorder = document.createElement("div");
      reorder.className = "reorder-buttons";

      const upBtn = document.createElement("button");
      upBtn.className = "icon-btn";
      upBtn.textContent = "↑";
      upBtn.setAttribute("aria-label", "Move up");
      upBtn.disabled = index === 0;
      upBtn.addEventListener("click", () => moveFile(entry.id, -1));

      const downBtn = document.createElement("button");
      downBtn.className = "icon-btn";
      downBtn.textContent = "↓";
      downBtn.setAttribute("aria-label", "Move down");
      downBtn.disabled = index === files.length - 1;
      downBtn.addEventListener("click", () => moveFile(entry.id, 1));

      const removeBtn = document.createElement("button");
      removeBtn.className = "icon-btn remove";
      removeBtn.textContent = "✕";
      removeBtn.setAttribute("aria-label", "Remove file");
      removeBtn.addEventListener("click", () => removeFile(entry.id));

      reorder.appendChild(upBtn);
      reorder.appendChild(downBtn);
      reorder.appendChild(removeBtn);

      li.appendChild(name);
      li.appendChild(size);
      li.appendChild(reorder);
      fileListEl.appendChild(li);
    });

    const hasFiles = files.length > 0;
    clearBtn.disabled = !hasFiles;
    mergeBtn.disabled = files.length < 2;
  }

  async function mergePdfs() {
    if (files.length < 2) return;

    mergeBtn.disabled = true;
    clearBtn.disabled = true;
    setStatus("Merging PDFs…");

    try {
      const { PDFDocument } = PDFLib;
      const mergedPdf = await PDFDocument.create();

      for (const entry of files) {
        const bytes = await entry.file.arrayBuffer();
        let sourcePdf;
        try {
          sourcePdf = await PDFDocument.load(bytes);
        } catch (err) {
          throw new Error(`Could not read "${entry.file.name}". It may be corrupted or password-protected.`);
        }
        const pageIndices = sourcePdf.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      downloadBlob(mergedBytes, "merged.pdf");
      setStatus(`Merged ${files.length} files successfully.`, "success");
    } catch (err) {
      console.error(err);
      setStatus(err.message || "Something went wrong while merging.", "error");
    } finally {
      mergeBtn.disabled = files.length < 2;
      clearBtn.disabled = files.length === 0;
    }
  }

  function downloadBlob(bytes, filename) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  fileInput.addEventListener("change", (e) => {
    addFiles(e.target.files);
    fileInput.value = "";
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer && e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  });

  mergeBtn.addEventListener("click", mergePdfs);

  clearBtn.addEventListener("click", () => {
    files = [];
    setStatus("");
    render();
  });

  render();
})();
