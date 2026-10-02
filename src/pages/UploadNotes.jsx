import { useState } from "react";

const DB_NAME = "NoteShareDB";
const STORE_NAME = "uploadedNotes";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function saveNote(note) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite"
    );

    const store =
      transaction.objectStore(STORE_NAME);

    store.put(note);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

function getCurrentUser() {
  const storedUser =
    localStorage.getItem(
      "noteShareCurrentUser"
    );

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error(
      "Could not read current user:",
      error
    );

    return null;
  }
}

function UploadNotes() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] =
    useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] =
    useState(false);

  const handleFileChange = (event) => {
    const selectedFile =
      event.target.files[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (
      selectedFile.type !==
      "application/pdf"
    ) {
      setFile(null);
      setMessage(
        "Please select a PDF file only."
      );
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setFile(null);
      setMessage(
        "File size must be less than 10 MB."
      );
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");

    if (
      !title.trim() ||
      !subject ||
      !file
    ) {
      setMessage(
        "Please fill in all required fields."
      );
      return;
    }

    const currentUser =
      getCurrentUser();

    if (!currentUser) {
      setMessage(
        "Please login before uploading notes."
      );
      return;
    }

    try {
      setUploading(true);

      const newNote = {
        id: Date.now(),
        title: title.trim(),
        subject,
        description:
          description.trim(),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        file,
        rating: "New",
        downloads: 0,
        color: "purple",
        uploadedAt:
          new Date().toISOString(),

        uploadedBy:
          currentUser.name,

        uploadedByEmail:
          currentUser.email,

        uploadedById:
          currentUser.id,
      };

      await saveNote(newNote);

      setMessage(
        "Note uploaded successfully!"
      );

      setTitle("");
      setSubject("");
      setDescription("");
      setFile(null);

      event.target.reset();
    } catch (error) {
      console.error(
        "Upload failed:",
        error
      );

      setMessage(
        "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "0 KB";
    }

    const megabytes =
      bytes / (1024 * 1024);

    if (megabytes >= 1) {
      return `${megabytes.toFixed(2)} MB`;
    }

    return `${Math.round(
      bytes / 1024
    )} KB`;
  };

  return (
    <div className="dashboard">

      {/* PAGE HEADER */}
      <div
        style={{
          marginBottom: "30px",
        }}
      >
        <h1
          style={{
            fontSize: "42px",
            margin: "0 0 8px",
            fontWeight: "700",
          }}
        >
          Upload Notes
        </h1>

        <p
          style={{
            margin: 0,
            color: "#999aaa",
            fontSize: "15px",
          }}
        >
          Share your study notes with
          other students.
        </p>
      </div>

      {/* UPLOAD FORM */}
      <div
        style={{
          maxWidth: "850px",
          background: "#ffffff",
          border:
            "1px solid #e5e5e8",
          borderRadius: "22px",
          padding: "32px",
          boxShadow:
            "0 8px 30px rgba(20, 20, 40, 0.04)",
        }}
      >
        <form
          onSubmit={handleSubmit}
        >

          {/* TITLE */}
          <div
            style={{
              marginBottom: "22px",
            }}
          >
            <label
              htmlFor="note-title"
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "9px",
              }}
            >
              Note Title *
            </label>

            <input
              id="note-title"
              type="text"
              placeholder="Enter note title"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              maxLength={100}
              style={{
                width: "100%",
                height: "50px",
                border:
                  "1px solid #e5e5e8",
                borderRadius: "12px",
                padding: "0 15px",
                fontSize: "14px",
                boxSizing:
                  "border-box",
                outline: "none",
              }}
            />
          </div>

          {/* SUBJECT */}
          <div
            style={{
              marginBottom: "22px",
            }}
          >
            <label
              htmlFor="note-subject"
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "9px",
              }}
            >
              Subject *
            </label>

            <select
              id="note-subject"
              value={subject}
              onChange={(event) =>
                setSubject(
                  event.target.value
                )
              }
              style={{
                width: "100%",
                height: "50px",
                border:
                  "1px solid #e5e5e8",
                borderRadius: "12px",
                padding: "0 15px",
                background:
                  "#ffffff",
                fontSize: "14px",
                boxSizing:
                  "border-box",
                outline: "none",
              }}
            >
              <option value="">
                Select a subject
              </option>

              <option value="Computer Science">
                Computer Science
              </option>

              <option value="Mathematics">
                Mathematics
              </option>

              <option value="Electronics">
                Electronics
              </option>

              <option value="Physics">
                Physics
              </option>

              <option value="Engineering">
                Engineering
              </option>
            </select>
          </div>

          {/* DESCRIPTION */}
          <div
            style={{
              marginBottom: "22px",
            }}
          >
            <label
              htmlFor="note-description"
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "9px",
              }}
            >
              Description
            </label>

            <textarea
              id="note-description"
              placeholder="Briefly describe what these notes contain..."
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              rows="5"
              maxLength={500}
              style={{
                width: "100%",
                border:
                  "1px solid #e5e5e8",
                borderRadius: "12px",
                padding:
                  "14px 15px",
                fontSize: "14px",
                resize: "vertical",
                boxSizing:
                  "border-box",
                outline: "none",
              }}
            />

            <div
              style={{
                textAlign: "right",
                marginTop: "6px",
                color: "#999aaa",
                fontSize: "12px",
              }}
            >
              {description.length}/500
            </div>
          </div>

          {/* PDF UPLOAD */}
          <div
            style={{
              marginBottom: "25px",
            }}
          >
            <label
              htmlFor="note-file"
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "9px",
              }}
            >
              Upload PDF *
            </label>

            <div
              style={{
                border:
                  "2px dashed #d8d8df",
                borderRadius: "15px",
                padding:
                  "35px 20px",
                textAlign: "center",
                background:
                  "#fafafd",
              }}
            >
              <div
                style={{
                  fontSize: "42px",
                  marginBottom: "10px",
                  color: "#713cff",
                }}
              >
                ↑
              </div>

              <p
                style={{
                  margin:
                    "0 0 8px",
                  fontWeight: "600",
                }}
              >
                Choose your PDF file
              </p>

              <p
                style={{
                  margin:
                    "0 0 15px",
                  color: "#999aaa",
                  fontSize: "13px",
                }}
              >
                PDF files only • Maximum
                size 10 MB
              </p>

              <input
                id="note-file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={
                  handleFileChange
                }
              />

              {file && (
                <div
                  style={{
                    marginTop: "15px",
                    padding:
                      "12px 15px",
                    borderRadius: "10px",
                    background:
                      "#f3efff",
                    color: "#713cff",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  📄 {file.name}
                  <br />
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#777",
                    }}
                  >
                    {formatFileSize(
                      file.size
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* MESSAGE */}
          {message && (
            <div
              style={{
                marginBottom: "20px",
                padding:
                  "13px 15px",
                borderRadius: "10px",
                background:
                  message.includes(
                    "successfully"
                  )
                    ? "#ecfdf3"
                    : "#fff4f4",
                color:
                  message.includes(
                    "successfully"
                  )
                    ? "#16834a"
                    : "#d33",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              {message}
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            className="upload-button"
            disabled={uploading}
            style={{
              width: "100%",
              fontSize: "15px",
              opacity:
                uploading ? 0.7 : 1,
              cursor:
                uploading
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {uploading
              ? "Uploading..."
              : "Upload Note"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default UploadNotes;