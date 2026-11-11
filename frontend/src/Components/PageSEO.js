import { useEffect } from "react";

function setMetaDescription(content) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
}

function setMetaRobots(content) {
    let meta = document.querySelector('meta[name="robots"]');
    if (!content) {
        if (meta) meta.parentNode.removeChild(meta);
        return;
    }
    if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "robots");
        document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
}

function PageSEO({ title, description, robots }) {
    useEffect(() => {
        document.title = title;
        if (description != null && description !== '') {
            setMetaDescription(description);
        }
        setMetaRobots(robots);
        return () => {
            if (robots) setMetaRobots(null);
        };
    }, [title, description, robots]);

    return null;
}

export default PageSEO;
