import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get("http://127.0.0.1:5000");

                setData(response.data);
            } catch (error) {
                setError(error.message);
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