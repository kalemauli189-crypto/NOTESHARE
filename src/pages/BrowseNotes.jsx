import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

const DB_NAME = "NoteShareDB";
const STORE_NAME = "uploadedNotes";

const subjects = [
  "All Subjects",
  "Computer Science",
  "Mathematics",
  "Electronics",
  "Physics",
];

function getCurrentUser() {
  try {
    const storedUser = localStorage.getItem("noteShareCurrentUser");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getUploadedNotes() {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then((database) => {
        const transaction = database.transaction(
          STORE_NAME,
          "readonly"
        );

        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
          database.close();
        };

        request.onerror = () => {
          reject(request.error);
          database.close();
        };
      })
      .catch((error) => {
        reject(error);
      });
  });
}

async function incrementDownloadCount(noteId) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      STORE_NAME,
      "readwrite"
    );

    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(noteId);

    request.onsuccess = () => {
      const note = request.result;

      if (!note) {
        database.close();
        reject(new Error("Note not found."));
        return;
      }

      note.downloads = Number(note.downloads) || 0;
      note.downloads += 1;

      store.put(note);
    };

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

function BrowseNotes() {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentUser = getCurrentUser();

  const savedNotesKey = currentUser
    ? `noteShareSavedNotes_${currentUser.id}`
    : "noteShareSavedNotes_guest";

  const initialSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(initialSearch);
  const [subject, setSubject] = useState("All Subjects");
  const [uploadedNotes, setUploadedNotes] = useState([]);

  const [savedNotes, setSavedNotes] = useState(() => {
    try {
      const storedNotes =
        localStorage.getItem(savedNotesKey);

      return storedNotes ? JSON.parse(storedNotes) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const loadUploadedNotes = async () => {
      try {
        const notes = await getUploadedNotes();

        const formattedNotes = notes.map((note) => ({
          ...note,
          uploadedBy: note.uploadedBy || "Student",
          rating: note.rating || "New",
          downloads: Number(note.downloads) || 0,
          color: note.color || "purple",
        }));

        setUploadedNotes(formattedNotes);
      } catch (error) {
        console.error(
          "Failed to load uploaded notes:",
          error
        );
      }
    };

    loadUploadedNotes();
  }, []);

  const handleSearchChange = (value) => {
    setSearch(value);

    if (value.trim()) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  const handleSave = (note) => {
    const alreadySaved = savedNotes.some(
      (savedNote) => savedNote.id === note.id
    );

    let updatedNotes;

    if (alreadySaved) {
      updatedNotes = savedNotes.filter(
        (savedNote) => savedNote.id !== note.id
      );
    } else {
      updatedNotes = [...savedNotes, note];
    }

    setSavedNotes(updatedNotes);

    localStorage.setItem(
      savedNotesKey,
      JSON.stringify(updatedNotes)
    );
  };

  const handleDownload = async (note) => {
    if (!note.file) {
      window.alert(
        "PDF file is not available for this note."
      );
      return;
    }

    try {
      await incrementDownloadCount(note.id);

      setUploadedNotes((currentNotes) =>
        currentNotes.map((currentNote) =>
          currentNote.id === note.id
            ? {
                ...currentNote,
                downloads:
                  (Number(currentNote.downloads) || 0) + 1,
              }
            : currentNote
        )
      );

      const pdfUrl = URL.createObjectURL(note.file);

      const link = document.createElement("a");

      link.href = pdfUrl;
      link.download =
        note.fileName ||
        `${note.title || "Note"}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
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

  const handleViewPdf = (note) => {
    if (!note.file) {
      window.alert(
        "PDF file is not available for this note."
      );
      return;
    }

    const pdfUrl = URL.createObjectURL(note.file);

    window.open(
      pdfUrl,
      "_blank",
      "noopener,noreferrer"
    );

    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 60000);
  };

  const filteredNotes = useMemo(() => {
    const searchText = search
      .toLowerCase()
      .trim();

    return uploadedNotes.filter((note) => {
      const title =
        note.title?.toLowerCase() || "";

      const noteSubject =
        note.subject?.toLowerCase() || "";

      const uploadedBy =
        note.uploadedBy?.toLowerCase() || "";

      const description =
        note.description?.toLowerCase() || "";

      const matchesSearch =
        !searchText ||
        title.includes(searchText) ||
        noteSubject.includes(searchText) ||
        uploadedBy.includes(searchText) ||
        description.includes(searchText);

      const matchesSubject =
        subject === "All Subjects" ||
        note.subject === subject;

      return matchesSearch && matchesSubject;
    });
  }, [uploadedNotes, search, subject]);

  return (
    <div className="dashboard">
      <div className="section-header">
        <div>
          <h1
            style={{
              fontSize: "34px",
              marginBottom: "8px",
            }}
          >
            Browse Notes
          </h1>

          <p>
            Find notes shared by other students.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "14px",
          marginBottom: "25px",
          flexWrap: "wrap",
        }}
      >
        <div
          className="search-box"
          style={{
            flex: 1,
            minWidth: "260px",
          }}
        >
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search notes, subjects, topics..."
            value={search}
            onChange={(event) =>
              handleSearchChange(
                event.target.value
              )
            }
          />
        </div>

        <select
          value={subject}
          onChange={(event) =>
            setSubject(event.target.value)
          }
          style={{
            height: "52px",
            padding: "0 18px",
            border: "1px solid #e5e5e8",
            borderRadius: "14px",
            background: "white",
            color: "#555666",
            outline: "none",
            minWidth: "180px",
          }}
        >
          {subjects.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <strong style={{ fontSize: "15px" }}>
          {filteredNotes.length} notes found
        </strong>

        {savedNotes.length > 0 && (
          <span
            style={{
              marginLeft: "15px",
              color: "#713cff",
              fontSize: "14px",
            }}
          >
            {savedNotes.length} saved
          </span>
        )}
      </div>

      {filteredNotes.length > 0 ? (
        <div className="notes-grid">
          {filteredNotes.map((note) => {
            const isSaved = savedNotes.some(
              (savedNote) =>
                savedNote.id === note.id
            );

            return (
              <div
                className="note-card"
                key={note.id}
              >
                <div
                  className={`note-preview ${
                    note.color
                  }`}
                >
                  <span className="pdf-badge">
                    PDF
                  </span>

                  <button
                    className="more-button"
                    type="button"
                    onClick={() =>
                      window.alert(
                        "More options coming soon"
                      )
                    }
                    aria-label={`More options for ${note.title}`}
                  >
                    ⋯
                  </button>

                  <div className="document-icon">
                    ▤
                  </div>
                </div>

                <div className="note-content">
                  <div className="note-subject">
                    {note.subject}
                  </div>

                  <h3>{note.title}</h3>

                  <p>
                    Uploaded by{" "}
                    <strong>
                      {note.uploadedBy}
                    </strong>
                  </p>

                  {note.description && (
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#777888",
                        marginTop: "6px",
                      }}
                    >
                      {note.description}
                    </p>
                  )}

                  {note.fileName && (
                    <p
                      style={{
                        color: "#713cff",
                        fontSize: "12px",
                        fontWeight: "600",
                        marginTop: "8px",
                        wordBreak: "break-word",
                      }}
                    >
                      📄 {note.fileName}
                    </p>
                  )}

                  <div className="note-footer">
                    <span className="rating">
                      ★ {note.rating} ↓{" "}
                      {note.downloads || 0}
                    </span>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        justifyContent:
                          "flex-end",
                      }}
                    >
                      <button
                        className="save-button"
                        type="button"
                        onClick={() =>
                          handleViewPdf(note)
                        }
                      >
                        View PDF
                      </button>

                      <button
                        className="save-button"
                        type="button"
                        onClick={() =>
                          handleDownload(note)
                        }
                      >
                        Download
                      </button>

                      <button
                        className="save-button"
                        type="button"
                        onClick={() =>
                          handleSave(note)
                        }
                      >
                        {isSaved
                          ? "♥ Saved"
                          : "♡ Save"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            background: "white",
            border: "1px solid #e5e5e8",
            borderRadius: "18px",
            padding: "60px 20px",
            textAlign: "center",
            color: "#999aaa",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "12px",
            }}
          >
            📚
          </div>

          <h3
            style={{
              color: "#111118",
              marginBottom: "8px",
            }}
          >
            No notes available
          </h3>

          <p>
            {search || subject !== "All Subjects"
              ? "Try another search or subject."
              : "No students have uploaded notes yet. Upload your first note to get started."}
          </p>
        </div>
      )}
    </div>
  );
}

export default BrowseNotes;