/* Données seed + helpers partagés */

const TASK_TYPES = {
    standard: {label: "Standard", color: "#6b7280"},
    bug: {label: "Bug", color: "#e0394a"},
    spike: {label: "Spike", color: "#b45ee0"},
    amelioration: {label: "Amélioration", color: "#1f9c70"},
};

const COLUMNS = [
    {id: "todo", title: "À faire", color: "#94a3b8"},
    {id: "doing", title: "En cours", color: "#3b6ef5"},
    {id: "done", title: "Terminé", color: "#1f9c70"},
];

const AVATAR_COLORS = ["#3b6ef5", "#e0394a", "#1f9c70", "#b45ee0", "#f59e0b", "#0ea5e9", "#ec4899"];

function avatarColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name) {
    return (name || "").split(/\s+|_/).filter(Boolean).slice(0, 2).map(function (s) {
        return s[0].toUpperCase();
    }).join("");
}

let ALL_USERS = [
    {id: "u1", pseudo: "audrey", name: "Audrey Mercier"},
    {id: "u2", pseudo: "thomas", name: "Thomas Bernard"},
    {id: "u3", pseudo: "lila", name: "Lila Nguyen"},
    {id: "u4", pseudo: "kamel", name: "Kamel Bouzid"},
    {id: "u5", pseudo: "claire", name: "Claire Dubois"},
    {id: "u6", pseudo: "vincent", name: "Vincent Roy"},
];

let ME = ALL_USERS[0];

function userById(id) {
    return ALL_USERS.find(function (u) {
        return u.id === id;
    });
}

function seedBoards() {
    return [
        {
            id: "b1", name: "Refonte Portail RH",
            members: ["u1", "u2", "u3", "u4"],
            createdAt: "2026-02-11T09:00:00",
            tasks: [
                {
                    id: "t1",
                    title: "Définir les personas pour les 3 portails internes",
                    description: "Workshop avec @claire et @thomas pour cadrer les usages. Livrable : 1 fiche persona par profil.",
                    type: "standard",
                    column: "todo",
                    assignee: "u3",
                    comments: [{
                        id: "c1",
                        author: "u2",
                        at: "2026-02-12T10:30:00",
                        text: "Je peux préparer la trame du workshop. @audrey on cale jeudi ?"
                    }],
                    attachments: [],
                    history: [{at: "2026-02-11T09:14:00", text: "Tâche créée par audrey"}, {
                        at: "2026-02-11T09:14:00",
                        text: "Assignée à lila"
                    }]
                },
                {
                    id: "t2",
                    title: "Audit accessibilité RGAA sur l'existant",
                    description: "Passer Lighthouse + Wave sur les 12 pages clés. Documenter les écarts AA bloquants.",
                    type: "spike",
                    column: "todo",
                    assignee: "u4",
                    comments: [],
                    attachments: [{id: "a1", name: "audit-template.xlsx", size: 24576}],
                    history: [{at: "2026-02-13T11:00:00", text: "Tâche créée par audrey"}]
                },
                {
                    id: "t3",
                    title: "Bug : déconnexion silencieuse après 15min",
                    description: "La session expire sans redirection. À reproduire en préprod, vérifier la config Tomcat.",
                    type: "bug",
                    column: "doing",
                    assignee: "u2",
                    comments: [{
                        id: "c2",
                        author: "u4",
                        at: "2026-02-14T14:20:00",
                        text: "Reproduit en local — c'est bien le timeout servlet, je creuse."
                    }, {
                        id: "c3",
                        author: "u2",
                        at: "2026-02-14T16:05:00",
                        text: "@kamel merci, je regarde la conf web.xml"
                    }],
                    attachments: [{id: "a2", name: "trace-session.log", size: 8192}],
                    history: [{at: "2026-02-14T09:00:00", text: "Tâche créée par audrey"}, {
                        at: "2026-02-14T13:00:00",
                        text: "Déplacée de À faire vers En cours"
                    }]
                },
                {
                    id: "t4",
                    title: "Améliorer le contraste des boutons secondaires",
                    description: "Les boutons 'ghost' tombent à 3.2:1, on vise 4.5:1.",
                    type: "amelioration",
                    column: "doing",
                    assignee: "u3",
                    comments: [],
                    attachments: [],
                    history: [{at: "2026-02-15T10:00:00", text: "Tâche créée par lila"}]
                },
                {
                    id: "t5",
                    title: "Mise en place du pipeline Maven",
                    description: "Build + tests JUnit + génération du WAR.",
                    type: "standard",
                    column: "done",
                    assignee: "u4",
                    comments: [{
                        id: "c4",
                        author: "u4",
                        at: "2026-02-09T17:00:00",
                        text: "WAR déployé sur Tomcat 11.0.18 sans accroc."
                    }],
                    attachments: [],
                    history: [{at: "2026-02-08T08:30:00", text: "Tâche créée par kamel"}, {
                        at: "2026-02-09T16:00:00",
                        text: "Déplacée vers En cours"
                    }, {at: "2026-02-09T17:30:00", text: "Déplacée vers Terminé"}]
                },
                {
                    id: "t6",
                    title: "Schéma H2 : tables users / boards / tasks / comments",
                    description: "Script SQL exécuté au build. Pas d'ORM.",
                    type: "standard",
                    column: "done",
                    assignee: "u2",
                    comments: [],
                    attachments: [{id: "a3", name: "schema-v1.sql", size: 4096}],
                    history: [{at: "2026-02-05T11:00:00", text: "Tâche créée par thomas"}, {
                        at: "2026-02-07T15:00:00",
                        text: "Terminée"
                    }]
                },
            ],
        },
        {
            id: "b2", name: "App Mobile Terrain",
            members: ["u1", "u5", "u6"],
            createdAt: "2026-01-22T14:00:00",
            tasks: [
                {
                    id: "t10",
                    title: "Cadrer le périmètre du MVP terrain",
                    description: "Liste des fonctionnalités prioritaires pour les agents en intervention.",
                    type: "standard",
                    column: "doing",
                    assignee: "u5",
                    comments: [],
                    attachments: [],
                    history: [{at: "2026-01-23T09:00:00", text: "Tâche créée par claire"}]
                },
                {
                    id: "t11",
                    title: "Spike : faisabilité offline-first sur PWA",
                    description: "Tester IndexedDB + Service Worker pour synchro différée.",
                    type: "spike",
                    column: "todo",
                    assignee: "u6",
                    comments: [],
                    attachments: [],
                    history: [{at: "2026-01-25T10:00:00", text: "Tâche créée par vincent"}]
                },
            ],
        },
    ];
}

function uid(prefix) {
    return (prefix || "x") + "_" + Math.random().toString(36).slice(2, 9);
}

function fmtDateTime(iso) {
    try {
        return new Date(iso).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch (e) {
        return iso;
    }
}

function fmtRelative(iso) {
    try {
        let diff = (Date.now() - new Date(iso).getTime()) / 1000;
        if (diff < 60) return "à l'instant";
        if (diff < 3600) return Math.floor(diff / 60) + " min";
        if (diff < 86400) return Math.floor(diff / 3600) + " h";
        if (diff < 604800) return Math.floor(diff / 86400) + " j";
        return new Date(iso).toLocaleDateString("fr-FR", {day: "2-digit", month: "short"});
    } catch (e) {
        return "";
    }
}

function fmtSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " Ko";
    return (bytes / 1048576).toFixed(1) + " Mo";
}

function esc(s) {
    let d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
}

function renderMentions(text) {
    if (!text) return "";
    return esc(text).replace(/@(\w+)/g, function (match, pseudo) {
        let u = ALL_USERS.find(function (u) {
            return u.pseudo === pseudo.toLowerCase();
        });
        if (u) return '<span class="mention">@' + esc(u.pseudo) + '</span>';
        return match;
    });
}

function collectMentions(text) {
    let out = [], re = /@(\w+)/g, m;
    while ((m = re.exec(text || ""))) {
        let u = ALL_USERS.find(function (u) {
            return u.pseudo === m[1].toLowerCase();
        });
        if (u && out.indexOf(u.pseudo) === -1) out.push(u.pseudo);
    }
    return out;
}

function avatarHtml(name, cls) {
    return '<div class="avatar' + (cls ? " " + cls : "") + '" style="background:' + avatarColor(name) + '" title="' + esc(name) + '">' + initials(name) + '</div>';
}
