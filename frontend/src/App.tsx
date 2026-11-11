import { useEffect, useState } from "react";
import axios from "axios";

export default function App() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const serverUrl = import.meta.env.VITE_SERVER_URL || "http://127.0.0.1:5000";
                const response = await axios.get(serverUrl);
                console.log("respose1: ", response.data);
                setData(response.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <h2>Loading...</h2>;

    if (error) return <h2>Error: {error}</h2>;

    return (
        <div>
            <h1>Backend Data</h1>

            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}