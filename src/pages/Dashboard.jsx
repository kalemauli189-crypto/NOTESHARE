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
      resolve(request.result || []);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
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
        resolve(null);
        return;
      }

      note.downloads = Number(note.downloads) || 0;
      note.downloads += 1;

      const updateRequest = store.put(note);

      updateRequest.onsuccess = () => {
        db.close();
        resolve(note);
      };

      updateRequest.onerror = () => {
        db.close();
        reject(updateRequest.error);
      };
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

function getCurrentUser() {
  const storedUser =
    localStorage.getItem("noteShareCurrentUser");

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

function Dashboard() {
  const [uploadedCount, setUploadedCount] = useState(0);
  const [myUploadCount, setMyUploadCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [averageRating, setAverageRating] =
    useState("0.0");
  const [recentNotes, setRecentNotes] = useState([]);

  const [subjectCounts, setSubjectCounts] = useState({
    "Computer Science": 0,
    Mathematics: 0,
    Electronics: 0,
    Management: 0,
  });

  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id ?? null;

  const subjects = [
    {
      name: "Computer Science",
      icon: "💻",
      color: "green",
    },
    {
      name: "Mathematics",
      icon: "📐",
      color: "purple",
    },
    {
      name: "Electronics",
      icon: "⚡",
      color: "yellow",
    },
    {
      name: "Management",
      icon: "📊",
      color: "blue",
    },
  ];

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const uploadedNotes =
          await getUploadedNotes();

        setUploadedCount(uploadedNotes.length);

        if (currentUserId !== null) {
          const myNotes = uploadedNotes.filter(
            (note) =>
              note.uploadedById === currentUserId
          );

          setMyUploadCount(myNotes.length);
        } else {
          setMyUploadCount(0);
        }

        const sortedNotes = [...uploadedNotes].sort(
          (a, b) => {
            const dateA = new Date(
              a.uploadedAt || 0
            ).getTime();

            const dateB = new Date(
              b.uploadedAt || 0
            ).getTime();

            return dateB - dateA;
          }
        );

        setRecentNotes(
          sortedNotes.slice(0, 3)
        );

        const newSubjectCounts = {
          "Computer Science": 0,
          Mathematics: 0,
          Electronics: 0,
          Management: 0,
        };

        uploadedNotes.forEach((note) => {
          const noteSubject = note.subject;

          if (
            Object.prototype.hasOwnProperty.call(
              newSubjectCounts,
              noteSubject
            )
          ) {
            newSubjectCounts[noteSubject] += 1;
          }
        });

        setSubjectCounts(newSubjectCounts);

        const ratedNotes =
          uploadedNotes.filter((note) => {
            const rating = Number(note.rating);

            return (
              Number.isInteger(rating) &&
              rating >= 1 &&
              rating <= 5
            );
          });

        if (ratedNotes.length > 0) {
          const totalRating =
            ratedNotes.reduce(
              (total, note) =>
                total + Number(note.rating),
              0
            );

          const average =
            totalRating / ratedNotes.length;

          setAverageRating(
            average.toFixed(1)
          );
        } else {
          setAverageRating("0.0");
        }
      } catch (error) {
        console.error(
          "Could not load dashboard data:",
          error
        );
      }

      if (currentUserId !== null) {
        const savedNotesKey =
          `noteShareSavedNotes_${currentUserId}`;

        const storedNotes =
          localStorage.getItem(
            savedNotesKey
          );

        if (storedNotes) {
          try {
            const notes =
              JSON.parse(storedNotes);

            setSavedCount(
              Array.isArray(notes)
                ? notes.length
                : 0
            );
          } catch (error) {
            console.error(
              "Could not read saved notes:",
              error
            );

            setSavedCount(0);
          }
        } else {
          setSavedCount(0);
        }
      } else {
        setSavedCount(0);
      }
    };

    loadDashboardData();
  }, [currentUserId]);

  const goToUpload = () => {
    window.location.href = "/upload";
  };

  const goToNotes = () => {
    window.location.href = "/notes";
  };

  const goToSubjects = () => {
    window.location.href = "/subjects";
  };

  const handleViewPdf = (note) => {
    if (!note.file) {
      alert("PDF file is not available.");
      return;
    }

    const fileUrl =
      URL.createObjectURL(note.file);

    window.open(fileUrl, "_blank");

    setTimeout(() => {
      URL.revokeObjectURL(fileUrl);
    }, 60000);
  };

  const handleDownload = async (note) => {
    if (!note.file) {
      alert("PDF file is not available.");
      return;
    }

    try {
      await incrementDownloadCount(note.id);

      const fileUrl =
        URL.createObjectURL(note.file);

      const link =
        document.createElement("a");

      link.href = fileUrl;

      link.download =
        note.fileName ||
        `${note.title}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
      }, 1000);
    } catch (error) {
      console.error(
        "Could not download PDF:",
        error
      );

      alert(
        "Could not download the PDF."
      );
    }
  };

  const getRating = (note) => {
    const rating = Number(note.rating);

    if (
      Number.isInteger(rating) &&
      rating >= 1 &&
      rating <= 5
    ) {
      return rating.toFixed(1);
    }

    return "New";
  };

  const firstName =
    currentUser?.name?.split(" ")[0] ||
    "Student";

  return (
    <div className="dashboard">

      {/* Welcome Section */}
      <section className="welcome-card">
        <div>
          <h1>
            Welcome back, {firstName}! 👋
          </h1>

          <p>
            Find useful notes, share your
            knowledge and learn together.
          </p>
        </div>

        <button
          className="upload-button"
          type="button"
          onClick={goToUpload}
        >
          + &nbsp; Upload Notes
        </button>
      </section>

      {/* Statistics */}
      <section className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon green">
            ▤
          </div>

          <div>
            <span>Total Notes</span>
            <strong>
              {uploadedCount}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            ↑
          </div>

          <div>
            <span>My Uploads</span>
            <strong>
              {myUploadCount}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            ♡
          </div>

          <div>
            <span>Saved Notes</span>
            <strong>
              {savedCount}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            ★
          </div>

          <div>
            <span>Average Rating</span>
            <strong>
              {averageRating}
            </strong>
          </div>
        </div>

      </section>

      {/* Main Dashboard */}
      <section className="dashboard-grid">

        {/* Recent Notes */}
        <div className="recent-section">

          <div className="section-header">
            <div>
              <h2>
                Recent Notes
              </h2>

              <p>
                Recently added notes from
                students
              </p>
            </div>

            <button
              className="view-all"
              type="button"
              onClick={goToNotes}
            >
              View all →
            </button>
          </div>

          <div className="notes-grid">

            {recentNotes.length === 0 ? (
              <div className="empty-state">

                <div className="document-icon">
                  ▤
                </div>

                <h3>
                  No notes uploaded yet
                </h3>

                <p>
                  Upload your first PDF to
                  see it here.
                </p>

                <button
                  className="upload-button"
                  type="button"
                  onClick={goToUpload}
                >
                  + &nbsp; Upload Notes
                </button>

              </div>
            ) : (
              recentNotes.map(
                (note, index) => (
                  <div
                    className="note-card"
                    key={note.id}
                  >

                    <div
                      className={`note-preview ${
                        note.color ||
                        [
                          "green",
                          "purple",
                          "yellow",
                        ][index % 3]
                      }`}
                    >

                      <span className="pdf-badge">
                        PDF
                      </span>

                      <button
                        className="more-button"
                        type="button"
                        onClick={() =>
                          handleViewPdf(note)
                        }
                        aria-label="View PDF"
                      >
                        ⋯
                      </button>

                      <div className="document-icon">
                        ▤
                      </div>

                    </div>

                    <div className="note-content">

                      <span className="note-subject">
                        {note.subject ||
                          "General"}
                      </span>

                      <h3>
                        {note.title}
                      </h3>

                      <p>
                        Uploaded by{" "}
                        <strong>
                          {note.uploadedBy ||
                            "Student"}
                        </strong>
                      </p>

                      <div className="note-footer">

                        <span className="rating">
                          ★{" "}
                          {getRating(note)}
                        </span>

                        <button
                          className="save-button"
                          type="button"
                          onClick={() =>
                            handleDownload(note)
                          }
                        >
                          ↓ Download
                        </button>

                      </div>

                    </div>

                  </div>
                )
              )
            )}

          </div>
        </div>

        {/* Popular Subjects */}
        <div className="subjects-section">

          <div className="section-header">
            <div>
              <h2>
                Popular Subjects
              </h2>

              <p>
                Explore notes by subject
              </p>
            </div>

            <button
              className="view-all"
              type="button"
              onClick={goToSubjects}
            >
              View all →
            </button>
          </div>

          <div className="subjects-list">

            {subjects.map(
              (subject) => (
                <div
                  className="subject-card"
                  key={subject.name}
                  onClick={goToSubjects}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      goToSubjects();
                    }
                  }}
                >

                  <div
                    className={`subject-icon ${subject.color}`}
                  >
                    {subject.icon}
                  </div>

                  <div className="subject-info">

                    <strong>
                      {subject.name}
                    </strong>

                    <span>
                      {subjectCounts[
                        subject.name
                      ]}{" "}
                      notes
                    </span>

                  </div>

                  <span className="subject-arrow">
                    →
                  </span>

                </div>
              )
            )}

          </div>
        </div>

      </section>

    </div>
  );
}

export default Dashboard;