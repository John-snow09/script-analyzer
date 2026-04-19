import { useState } from "react";

function App() {
  const [files, setFiles] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (fileList) => {
    const srtFiles = Array.from(fileList).filter(f =>
      f.name.endsWith(".srt")
    );
    setFiles(srtFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please upload .srt files");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      setLoading(true);

      const res = await fetch("http://127.0.0.1:8000/compare", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center p-6">

      <h1 className="text-4xl font-bold mb-6">
        🎬 SRT Script Analyzer
      </h1>

      {/* Drag & Drop */}
      <div
        className={`w-full max-w-xl p-8 border-2 border-dashed rounded-2xl text-center transition
          ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <p className="mb-4 text-gray-600">
          Drag & drop .srt files here or click to select
        </p>

        <input
          type="file"
          multiple
          accept=".srt"
          onChange={(e) => handleFiles(e.target.files)}
          className="mb-4"
        />

        {files.length > 0 && (
          <div className="text-left mt-3">
            <p className="font-semibold">Selected Files:</p>
            {files.map((f, i) => (
              <p key={i} className="text-sm text-gray-600">
                📄 {f.name}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Button */}
      <button
        onClick={handleUpload}
        className="mt-5 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
      >
        Compare Scripts
      </button>

      {/* Loader */}
      {loading && (
        <p className="mt-4 text-gray-600 animate-pulse">
          ⏳ Analyzing scripts...
        </p>
      )}

      {/* Results */}
      {data && (
        <div className="mt-10 w-full max-w-3xl">
          
          <h2 className="text-lg font-medium mb-2">
            📊 Mode: <span className="font-semibold">{data.mode}</span>
          </h2>

          <h2 className="text-2xl font-bold text-green-600 mb-6">
            🏆 Best Script: {data.best_file}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {data.results.map((r, i) => (
              <div
                key={i}
                className={`p-5 rounded-xl shadow bg-white transition hover:scale-[1.02]
                  ${r.filename === data.best_file
                    ? "border-2 border-green-500"
                    : "border border-gray-200"}`}
              >
                <h3 className="font-semibold text-lg mb-2">
                  {i + 1}. {r.filename}
                </h3>

                <p className="text-sm mb-1">
                  <b>Score:</b> {r.score}
                </p>

                <p className="text-sm text-gray-600 italic mb-3">
                  {r.reason}
                </p>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><b>Words:</b> {r.details.word_count}</p>
                  <p><b>Unique:</b> {r.details.unique_words}</p>
                  <p><b>Diversity:</b> {r.details.diversity}</p>
                  <p><b>Sentence Len:</b> {r.details.avg_sentence_length}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;