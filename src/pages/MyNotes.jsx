import { useEffect, useState } from "react";

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

async function getUploadedNotes() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readonly"
    );

    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

async function deleteUploadedNote(noteId) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite"
    );

    const store = transaction.objectStore(STORE_NAME);

    store.delete(noteId);

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

async function updateNoteRating(noteId, rating) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite"
    );

    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(noteId);

    request.onsuccess = () => {
      const note = request.result;

      if (!note) {
        db.close();
        reject(new Error("Note not found."));
        return;
      }

      note.rating = rating;

      store.put(note);
    };

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

async function incrementDownloadCount(noteId) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite"
    );

    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(noteId);

    request.onsuccess = () => {
      const note = request.result;

      if (!note) {
        db.close();
        reject(new Error("Note not found."));
        return;
      }

      note.downloads =
        Number(note.downloads) || 0;

      note.downloads += 1;

      store.put(note);
    };

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
  try {
    const storedUser =
      localStorage.getItem(
        "noteShareCurrentUser"
      );

    return storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch {
    return null;
  }
}

function MyNotes() {
  const [search, setSearch] = useState("");
  const [uploadedNotes, setUploadedNotes] =
    useState([]);
  const [loading, setLoading] =
    useState(true);

  const currentUser = getCurrentUser();

  const savedNotesKey = currentUser
    ? `noteShareSavedNotes_${currentUser.id}`
    : "noteShareSavedNotes_guest";

  const [savedNotes, setSavedNotes] =
    useState(() => {
      try {
        const storedNotes =
          localStorage.getItem(
            savedNotesKey
          );

        return storedNotes
          ? JSON.parse(storedNotes)
          : [];
      } catch {
        return [];
      }
    });

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const notes =
          await getUploadedNotes();

        const userNotes = currentUser
          ? notes.filter(
              (note) =>
                note.uploadedById ===
                currentUser.id
            )
          : [];

        userNotes.sort(
          (a, b) =>
            new Date(b.uploadedAt) -
            new Date(a.uploadedAt)
        );

        setUploadedNotes(userNotes);
      } catch (error) {
        console.error(
          "Could not load uploaded notes:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [currentUser]);

  const filteredUploadedNotes =
    uploadedNotes.filter((note) =>
      `${note.title} ${note.subject} ${
        note.description || ""
      } ${note.fileName || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  const filteredSavedNotes =
    savedNotes.filter((note) =>
      `${note.title} ${note.subject} ${
        note.uploadedBy || ""
      }`
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  const handleUpload = () => {
    window.location.href = "/upload";
  };

  const handleRemoveSaved = (noteId) => {
    const updatedNotes =
      savedNotes.filter(
        (note) => note.id !== noteId
      );

    setSavedNotes(updatedNotes);

    localStorage.setItem(
      savedNotesKey,
      JSON.stringify(updatedNotes)
    );
  };

  const handleDeleteUploaded =
    async (noteId) => {
      const confirmDelete =
        window.confirm(
          "Are you sure you want to delete this note?"
        );

      if (!confirmDelete) {
        return;
      }

      try {
        await deleteUploadedNote(
          noteId
        );

        setUploadedNotes(
          (currentNotes) =>
            currentNotes.filter(
              (note) =>
                note.id !== noteId
            )
        );
      } catch (error) {
        console.error(
          "Could not delete note:",
          error
        );

        window.alert(
          "Could not delete the note. Please try again."
        );
      }
    };

  const handleOpenPdf = (note) => {
    if (!note.file) {
      window.alert(
        "PDF file is not available."
      );
      return;
    }

    const pdfUrl =
      URL.createObjectURL(note.file);

    window.open(
      pdfUrl,
      "_blank",
      "noopener,noreferrer"
    );

    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 60000);
  };

  const handleDownloadPdf =
    async (note) => {
      if (!note.file) {
        window.alert(
          "PDF file is not available."
        );
        return;
      }

      try {
        await incrementDownloadCount(
          note.id
        );

        setUploadedNotes(
          (currentNotes) =>
            currentNotes.map(
              (currentNote) =>
                currentNote.id === note.id
                  ? {
                      ...currentNote,
                      downloads:
                        (Number(
                          currentNote.downloads
                        ) || 0) + 1,
                    }
                  : currentNote
            )
        );

        const pdfUrl =
          URL.createObjectURL(
            note.file
          );

        const link =
          document.createElement("a");

        link.href = pdfUrl;

        link.download =
          note.fileName ||
          `${note.title || "Note"}.pdf`;

        document.body.appendChild(link);

        link.click();

        link.remove();

        setTimeout(() => {
          URL.revokeObjectURL(
            pdfUrl
          );
        }, 1000);
      } catch (error) {
        console.error(
          "Could not download note:",
          error
        );

        window.alert(
          "Could not download the PDF. Please try again."
        );
      }
    };

  const handleRating = async (
    noteId,
    rating
  ) => {
    try {
      await updateNoteRating(
        noteId,
        rating
      );

      setUploadedNotes(
        (currentNotes) =>
          currentNotes.map(
            (note) =>
              note.id === noteId
                ? {
                    ...note,
                    rating,
                  }
                : note
          )
      );
    } catch (error) {
      console.error(
        "Could not save rating:",
        error
      );

      window.alert(
        "Could not save your rating. Please try again."
      );
    }
  };

  const getRatingValue = (
    rating
  ) => {
    const numberRating =
      Number(rating);

    if (
      Number.isInteger(
        numberRating
      ) &&
      numberRating >= 1 &&
      numberRating <= 5
    ) {
      return numberRating;
    }

    return 0;
  };

  return (
    <div className="dashboard">
      <div className="section-header">
        <div>
          <h1
            style={{
              fontSize: "42px",
              margin: "0 0 8px",
            }}
          >
            My Notes
          </h1>

          <p>
            View and manage your uploaded and saved notes.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "15px",
          marginBottom: "35px",
          marginTop: "25px",
        }}
      >
        <div
          className="search-box"
          style={{
            flex: 1,
          }}
        >
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search your notes..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />
        </div>
      </div>

      <div className="section-header">
        <div>
          <h2>Your Uploaded Notes</h2>

          <p>
            {filteredUploadedNotes.length}{" "}
            notes found
          </p>
        </div>

        <button
          className="upload-button"
          type="button"
          onClick={handleUpload}
        >
          + Upload New Note
        </button>
      </div>

      {loading ? (
        <div
          style={{
            background: "white",
            border:
              "1px solid #e5e5e8",
            borderRadius: "18px",
            padding: "45px",
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#999aaa",
            }}
          >
            Loading your notes...
          </p>
        </div>
      ) : filteredUploadedNotes.length >
        0 ? (
        <div
          className="notes-grid"
          style={{
            marginBottom: "45px",
          }}
        >
          {filteredUploadedNotes.map(
            (note) => {
              const ratingValue =
                getRatingValue(
                  note.rating
                );

              return (
                <div
                  className="note-card"
                  key={note.id}
                >
                  <div
                    className={`note-preview ${
                      note.color ||
                      "purple"
                    }`}
                  >
                    <span className="pdf-badge">
                      PDF
                    </span>

                    <button
                      className="more-button"
                      type="button"
                      title="Delete note"
                      onClick={() =>
                        handleDeleteUploaded(
                          note.id
                        )
                      }
                    >
                      ⋯
                    </button>

                    <div className="document-icon">
                      ▤
                    </div>
                  </div>

                  <div className="note-content">
                    <span className="note-subject">
                      {note.subject}
                    </span>

                    <h3>
                      {note.title}
                    </h3>

                    <p>
                      {note.description ||
                        "No description provided."}
                    </p>

                    <p
                      style={{
                        color: "#713cff",
                        fontSize: "12px",
                        fontWeight: "600",
                        marginTop: "8px",
                        wordBreak:
                          "break-word",
                      }}
                    >
                      📄{" "}
                      {note.fileName}
                    </p>

                    <div
                      style={{
                        marginTop: "12px",
                        marginBottom:
                          "12px",
                      }}
                    >
                      <span
                        style={{
                          display:
                            "block",
                          fontSize:
                            "12px",
                          fontWeight:
                            "600",
                          color:
                            "#777887",
                          marginBottom:
                            "5px",
                        }}
                      >
                        Rate this note
                      </span>

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "2px",
                        }}
                      >
                        {[1, 2, 3, 4, 5].map(
                          (star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                handleRating(
                                  note.id,
                                  star
                                )
                              }
                              title={`Rate ${star} out of 5`}
                              style={{
                                border:
                                  "none",
                                background:
                                  "transparent",
                                padding:
                                  "2px",
                                cursor:
                                  "pointer",
                                fontSize:
                                  "22px",
                                lineHeight: 1,
                                color:
                                  star <=
                                  ratingValue
                                    ? "#f5b800"
                                    : "#d9d9df",
                              }}
                            >
                              ★
                            </button>
                          )
                        )}

                        <span
                          style={{
                            fontSize:
                              "12px",
                            color:
                              "#777887",
                            marginLeft:
                              "6px",
                          }}
                        >
                          {ratingValue >
                          0
                            ? `${ratingValue}/5`
                            : "Not rated"}
                        </span>
                      </div>
                    </div>

                    <div className="note-footer">
                      <span className="rating">
                        ★{" "}
                        {ratingValue >
                        0
                          ? ratingValue
                          : "New"}{" "}
                        ↓{" "}
                        {note.downloads ||
                          0}
                      </span>

                      <div
                        style={{
                          display:
                            "flex",
                          gap: "8px",
                          flexWrap:
                            "wrap",
                          justifyContent:
                            "flex-end",
                        }}
                      >
                        <button
                          className="save-button"
                          type="button"
                          onClick={() =>
                            handleOpenPdf(
                              note
                            )
                          }
                        >
                          View PDF
                        </button>

                        <button
                          className="save-button"
                          type="button"
                          onClick={() =>
                            handleDownloadPdf(
                              note
                            )
                          }
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      ) : (
        <div
          style={{
            background: "white",
            border:
              "1px solid #e5e5e8",
            borderRadius: "18px",
            padding: "40px",
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: "40px",
              marginBottom: "10px",
            }}
          >
            📄
          </div>

          <h3>
            No uploaded notes found
          </h3>

          <p
            style={{
              color: "#999aaa",
            }}
          >
            Upload your first study note.
          </p>

          <button
            className="upload-button"
            type="button"
            onClick={handleUpload}
          >
            + Upload Note
          </button>
        </div>
      )}

      <div
        className="section-header"
        style={{
          marginTop: "10px",
        }}
      >
        <div>
          <h2>Saved Notes</h2>

          <p>
            Notes you saved from Browse Notes.
          </p>
        </div>
      </div>

      {filteredSavedNotes.length > 0 ? (
        <div className="notes-grid">
          {filteredSavedNotes.map(
            (note) => (
              <div
                className="note-card"
                key={`saved-${note.id}`}
              >
                <div
                  className={`note-preview ${
                    note.color ||
                    "purple"
                  }`}
                >
                  <span className="pdf-badge">
                    PDF
                  </span>

                  <div className="document-icon">
                    ▤
                  </div>
                </div>

                <div className="note-content">
                  <span className="note-subject">
                    {note.subject}
                  </span>

                  <h3>
                    {note.title}
                  </h3>

                  <p>
                    Uploaded by{" "}
                    <strong>
                      {note.uploadedBy}
                    </strong>
                  </p>

                  <div className="note-footer">
                    <span className="rating">
                      ★{" "}
                      {note.rating} ↓{" "}
                      {note.downloads ||
                        0}
                    </span>

                    <button
                      className="save-button"
                      type="button"
                      onClick={() =>
                        handleRemoveSaved(
                          note.id
                        )
                      }
                    >
                      ♥ Saved
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <div
          style={{
            background: "white",
            border:
              "1px solid #e5e5e8",
            borderRadius: "18px",
            padding: "45px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "40px",
              marginBottom: "12px",
            }}
          >
            ♡
          </div>

          <h3>
            No saved notes yet
          </h3>

          <p
            style={{
              color: "#999aaa",
              marginBottom: "20px",
            }}
          >
            Go to Browse Notes and save notes you
            want to keep.
          </p>

          <button
            className="upload-button"
            type="button"
            onClick={() => {
              window.location.href =
                "/notes";
            }}
          >
            Browse Notes
          </button>
        </div>
      )}
    </div>
  );
}

export default MyNotes;