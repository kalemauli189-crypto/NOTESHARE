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

function Subjects() {
  const [search, setSearch] = useState("");
  const [subjectCounts, setSubjectCounts] = useState({
    "Computer Science": 0,
    Mathematics: 0,
    Electronics: 0,
    Physics: 0,
    Engineering: 0,
    Other: 0,
  });

  const [loading, setLoading] = useState(true);

  const subjects = [
    {
      id: 1,
      name: "Computer Science",
      description:
        "Programming, data structures and algorithms",
      icon: "⌘",
      color: "green",
    },
    {
      id: 2,
      name: "Mathematics",
      description:
        "Engineering mathematics and problem solving",
      icon: "∑",
      color: "purple",
    },
    {
      id: 3,
      name: "Electronics",
      description:
        "Digital electronics and circuit analysis",
      icon: "⌁",
      color: "yellow",
    },
    {
      id: 4,
      name: "Physics",
      description:
        "Mechanics, electricity and modern physics",
      icon: "⚛",
      color: "blue",
    },
    {
      id: 5,
      name: "Engineering",
      description:
        "Engineering concepts and technical subjects",
      icon: "⚙",
      color: "pink",
    },
    {
      id: 6,
      name: "Other",
      description:
        "Additional study materials and notes",
      icon: "◇",
      color: "orange",
    },
  ];

  useEffect(() => {
    const loadSubjectCounts = async () => {
      try {
        const uploadedNotes =
          await getUploadedNotes();

        const counts = {
          "Computer Science": 0,
          Mathematics: 0,
          Electronics: 0,
          Physics: 0,
          Engineering: 0,
          Other: 0,
        };

        uploadedNotes.forEach((note) => {
          const noteSubject = note.subject;

          if (
            Object.prototype.hasOwnProperty.call(
              counts,
              noteSubject
            )
          ) {
            counts[noteSubject] += 1;
          }
        });

        setSubjectCounts(counts);
      } catch (error) {
        console.error(
          "Could not load subject counts:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadSubjectCounts();
  }, []);

  const filteredSubjects = subjects.filter(
    (subject) =>
      `${subject.name} ${subject.description}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="dashboard">

      {/* Page Header */}
      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{
            fontSize: "42px",
            margin: "0 0 8px",
            fontWeight: "700",
          }}
        >
          Subjects
        </h1>

        <p
          style={{
            margin: 0,
            color: "#999aaa",
            fontSize: "15px",
          }}
        >
          Explore notes organized by subject.
        </p>
      </div>

      {/* Search */}
      <div
        className="search-box"
        style={{
          width: "100%",
          marginBottom: "38px",
          boxSizing: "border-box",
        }}
      >
        <span>⌕</span>

        <input
          type="text"
          placeholder="Search subjects..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
      </div>

      {/* Section Header */}
      <div style={{ marginBottom: "22px" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "22px",
          }}
        >
          All Subjects
        </h2>

        <p
          style={{
            margin: "8px 0 0",
            color: "#999aaa",
            fontSize: "14px",
          }}
        >
          {filteredSubjects.length} subjects found
        </p>
      </div>

      {/* Subjects List */}
      {filteredSubjects.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e5e5e8",
                borderRadius: "18px",
                padding: "20px 16px",
                display: "flex",
                alignItems: "center",
                gap: "20px",
                cursor: "pointer",
              }}
            >
              {/* Icon */}
              <div
                className={`subject-icon ${subject.color}`}
                style={{
                  width: "52px",
                  height: "52px",
                  minWidth: "52px",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "25px",
                }}
              >
                {subject.icon}
              </div>

              {/* Information */}
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    margin: "0 0 7px",
                    fontSize: "16px",
                  }}
                >
                  {subject.name}
                </h3>

                <p
                  style={{
                    margin: "0 0 8px",
                    color: "#999aaa",
                    fontSize: "14px",
                  }}
                >
                  {subject.description}
                </p>

                <p
                  style={{
                    margin: 0,
                    color: "#999aaa",
                    fontSize: "13px",
                  }}
                >
                  {loading
                    ? "Loading..."
                    : `${subjectCounts[subject.name]} notes available`}
                </p>
              </div>

              {/* Arrow */}
              <div
                style={{
                  color: "#999aaa",
                  fontSize: "22px",
                  paddingRight: "4px",
                }}
              >
                →
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e5e8",
            borderRadius: "18px",
            padding: "50px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "45px",
              marginBottom: "15px",
            }}
          >
            📚
          </div>

          <h2>No subjects found</h2>

          <p style={{ color: "#999aaa" }}>
            Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
}

export default Subjects;