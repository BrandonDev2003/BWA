"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../usuarios/components/Sidebar";

type Reaction = "like" | "love" | "dislike" | "haha";

type Comment = {
  id: number;
  contenido: string;
  created_at: string;
  user_id: number;
  user_nombre: string;
};

type Post = {
  id: number;
  contenido: string;
  created_at: string;

  author_id: number;
  author_nombre: string;
  author_rol: string;

  likes: number;
  loves: number;
  dislikes: number;
  hahas: number;

  my_reaction: Reaction | null;

  like_users: string[];
  love_users: string[];
  dislike_users: string[];
  haha_users: string[];

  image_url?: string | null;
  document_url?: string | null;
  document_name?: string | null;

  comments_count: number;
  comments: Comment[];
};

function isAdminRole(rol?: string | null) {
  return rol === "rrhh" || rol === "RRHH" || rol === "RRhh";
}

function UsersTooltip({ users }: { users?: string[] }) {
  if (!Array.isArray(users) || users.length === 0) return null;
  return (
    <span
      className="
        pointer-events-none
        absolute
        left-1/2 -translate-x-1/2
        top-full mt-2
        hidden group-hover:block
        z-[9999]
        rounded-xl
        border border-white/10
        bg-white/5
        backdrop-blur-2xl
        text-white/80 text-xs
        px-3 py-2
        shadow-2xl
        w-72
      "
    >
      <span className="pointer-events-none absolute inset-0 rounded-xl bg-black/35" />
      <span className="relative">{users.join(", ")}</span>
    </span>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [authStatus, setAuthStatus] = useState<
    "loading" | "authorized" | "unauthorized"
  >("loading");

  const [meRol, setMeRol] = useState<string | null>(null);
  const [meId, setMeId] = useState<number | null>(null);

  const [loadingFeed, setLoadingFeed] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);

  const [contenido, setContenido] = useState("");
  const [posting, setPosting] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);

  const [commentDraft, setCommentDraft] = useState<Record<number, string>>({});
  const [openComments, setOpenComments] = useState<Record<number, boolean>>({});

  const [openReactFor, setOpenReactFor] = useState<number | null>(null);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();

        if (data.ok) {
          setMeRol(data.user?.rol ?? null);
          setMeId(Number(data.user?.id) || null);
          setAuthStatus("authorized");
        } else {
          setAuthStatus("unauthorized");
        }
      } catch {
        setAuthStatus("unauthorized");
      }
    };
    verifyUser();
  }, []);

  useEffect(() => {
    if (authStatus === "unauthorized") router.replace("/login");
  }, [authStatus, router]);

  const loadFeed = async () => {
    setLoadingFeed(true);
    try {
      const res = await fetch("/api/posts", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        const fixed = (Array.isArray(data.posts) ? data.posts : []).map(
          (p: Post) => ({
            ...p,
            like_users: Array.isArray(p.like_users) ? p.like_users : [],
            love_users: Array.isArray(p.love_users) ? p.love_users : [],
            dislike_users: Array.isArray(p.dislike_users)
              ? p.dislike_users
              : [],
            haha_users: Array.isArray(p.haha_users) ? p.haha_users : [],
          })
        );

        setPosts(fixed);
        if (data?.me?.id) setMeId(Number(data.me.id));
        if (data?.me?.rol) setMeRol(data.me.rol);
      }
    } finally {
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    if (authStatus === "authorized") loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  const canPost = useMemo(() => isAdminRole(meRol), [meRol]);

  const publicar = async () => {
    if (!contenido.trim() && !imageFile && !docFile) return;

    setPosting(true);
    try {
      const fd = new FormData();
      fd.append("contenido", contenido);
      if (imageFile) fd.append("imagen", imageFile);
      if (docFile) fd.append("documento", docFile);

      const res = await fetch("/api/posts", {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setContenido("");
        setImageFile(null);
        setDocFile(null);
        await loadFeed();
      }
    } finally {
      setPosting(false);
    }
  };

  const reactToPost = async (postId: number, reaction: Reaction) => {
    const current = posts.find((p) => p.id === postId)?.my_reaction ?? null;
    const next = current === reaction ? null : reaction;

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, my_reaction: next } : p))
    );

    await fetch("/api/posts/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ postId, reaction: next }),
    });

    setOpenReactFor(null);
    await loadFeed();
  };

  const sendComment = async (postId: number) => {
    const text = (commentDraft[postId] || "").trim();
    if (!text) return;

    setCommentDraft((prev) => ({ ...prev, [postId]: "" }));

    await fetch("/api/posts/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ postId, contenido: text }),
    });

    setOpenComments((prev) => ({ ...prev, [postId]: true }));
    await loadFeed();
  };

  const deletePost = async (postId: number) => {
    await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
      credentials: "include",
    });
    await loadFeed();
  };

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0B0D10] text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4 shadow-2xl">
          Validando acceso...
        </div>
      </div>
    );
  }

  if (authStatus === "unauthorized") return null;

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage: "url('/fondo-bg.png')",
        backgroundSize: "cover", // ✅ con zoom (llena toda la pantalla)
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* overlay para legibilidad */}
      <div className="min-h-screen w-full bg-black/60">
        <div className="relative flex min-h-screen">
          <Sidebar />

          {openReactFor !== null && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpenReactFor(null)}
            />
          )}

          <main className="flex-1 p-6 md:p-8 relative z-10">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl md:text-3xl font-semibold text-white">
                  🏠 Home
                </h1>
                <span className="text-xs text-white/50">
                  Feed interno • {posts.length} post(s)
                </span>
              </div>

              {canPost && (
                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl p-4 relative overflow-visible">
                  <div className="pointer-events-none absolute inset-0 rounded-3xl bg-black/25" />
                  <div className="relative space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10" />
                      <input
                        value={contenido}
                        onChange={(e) => setContenido(e.target.value)}
                        className="
                          flex-1
                          bg-black/25
                          border border-white/10
                          rounded-full
                          px-4 py-3
                          outline-none
                          text-sm text-white/85
                          placeholder:text-white/35
                          focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-500/15
                          transition
                        "
                        placeholder="¿Qué estás pensando?"
                      />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <label
                        className="
                          text-sm
                          rounded-xl
                          border border-white/10
                          bg-white/5
                          px-3 py-2
                          cursor-pointer
                          text-white/75
                          hover:bg-white/10 hover:text-white
                          transition
                        "
                      >
                        📷 Imagen
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            setImageFile(e.target.files?.[0] ?? null)
                          }
                        />
                      </label>

                      <label
                        className="
                          text-sm
                          rounded-xl
                          border border-white/10
                          bg-white/5
                          px-3 py-2
                          cursor-pointer
                          text-white/75
                          hover:bg-white/10 hover:text-white
                          transition
                        "
                      >
                        📄 Documento
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                          className="hidden"
                          onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                        />
                      </label>

                      {(imageFile || docFile) && (
                        <span className="text-xs text-white/50">
                          {imageFile?.name || docFile?.name}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={publicar}
                        disabled={posting}
                        className={[
                          "px-4 py-2 rounded-2xl font-semibold transition border",
                          posting
                            ? "bg-white/5 text-white/40 border-white/10 cursor-not-allowed"
                            : "bg-emerald-500/90 hover:bg-emerald-500 text-black border-emerald-400/30",
                        ].join(" ")}
                      >
                        {posting ? "Publicando..." : "Publicar"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loadingFeed ? (
                <p className="text-white/50">Cargando noticias...</p>
              ) : posts.length === 0 ? (
                <p className="text-white/50">Aún no hay noticias.</p>
              ) : (
                <div className="space-y-4">
                  {posts.map((p) => {
                    const canDelete =
                      isAdminRole(meRol) || (meId != null && meId === p.author_id);

                    const bubbleOpen = openReactFor === p.id;

                    return (
                      <div
                        key={p.id}
                        className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl p-4 space-y-3 relative overflow-visible"
                      >
                        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-black/25" />

                        <div className="relative space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-white/90">
                                {p.author_nombre}
                              </p>
                              <p className="text-xs text-white/45">
                                {new Date(p.created_at).toLocaleString()} •{" "}
                                {p.author_rol}
                              </p>
                            </div>

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => deletePost(p.id)}
                                className="
                                  text-xs px-3 py-1.5 rounded-xl
                                  bg-red-500/15 border border-red-500/20
                                  text-white/90
                                  hover:bg-red-500/25 hover:border-red-500/30
                                  transition
                                "
                              >
                                Borrar
                              </button>
                            )}
                          </div>

                          <p className="whitespace-pre-wrap text-white/80">
                            {p.contenido}
                          </p>

                          {p.image_url && (
                            <div className="w-full flex justify-center bg-black/25 border border-white/10 rounded-2xl overflow-hidden">
                              <img
                                src={p.image_url}
                                alt="imagen"
                                className="w-full max-h-[520px] object-contain"
                              />
                            </div>
                          )}

                          {p.document_url && (
                            <a
                              href={p.document_url}
                              target="_blank"
                              className="text-emerald-300 hover:text-emerald-200 underline text-sm"
                            >
                              📄 {p.document_name || "Documento"}
                            </a>
                          )}

                          <div className="flex justify-between items-center text-sm text-white/60">
                            <div className="flex items-center gap-3">
                              <span className="relative group cursor-default">
                                <span>👍 {p.likes}</span>
                                <UsersTooltip users={p.like_users} />
                              </span>
                              <span className="relative group cursor-default">
                                <span>❤️ {p.loves}</span>
                                <UsersTooltip users={p.love_users} />
                              </span>
                              <span className="relative group cursor-default">
                                <span>👎 {p.dislikes}</span>
                                <UsersTooltip users={p.dislike_users} />
                              </span>
                              <span className="relative group cursor-default">
                                <span>😂 {p.hahas}</span>
                                <UsersTooltip users={p.haha_users} />
                              </span>
                            </div>

                            <button
                              type="button"
                              className="text-white/60 hover:text-white hover:underline transition"
                              onClick={() =>
                                setOpenComments((prev) => ({
                                  ...prev,
                                  [p.id]: !prev[p.id],
                                }))
                              }
                            >
                              {p.comments_count} comentarios
                            </button>
                          </div>

                          <div className="border-t border-white/10 pt-3 flex gap-2 relative z-50">
                            <div className="relative flex-1">
                              {bubbleOpen && (
                                <div
                                  className="
                                    absolute left-0 -top-14
                                    flex gap-2
                                    rounded-full
                                    border border-white/10
                                    bg-white/5
                                    backdrop-blur-2xl
                                    shadow-2xl
                                    px-3 py-2
                                    z-[9999]
                                  "
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="pointer-events-none absolute inset-0 rounded-full bg-black/30" />
                                  <div className="relative flex gap-2">
                                    <button
                                      className="h-9 w-9 rounded-full hover:bg-white/10 transition"
                                      onClick={() => reactToPost(p.id, "like")}
                                      title="Me gusta"
                                    >
                                      👍
                                    </button>
                                    <button
                                      className="h-9 w-9 rounded-full hover:bg-white/10 transition"
                                      onClick={() => reactToPost(p.id, "love")}
                                      title="Me encanta"
                                    >
                                      ❤️
                                    </button>
                                    <button
                                      className="h-9 w-9 rounded-full hover:bg-white/10 transition"
                                      onClick={() => reactToPost(p.id, "haha")}
                                      title="Me da risa"
                                    >
                                      😂
                                    </button>
                                    <button
                                      className="h-9 w-9 rounded-full hover:bg-white/10 transition"
                                      onClick={() => reactToPost(p.id, "dislike")}
                                      title="No me gusta"
                                    >
                                      👎
                                    </button>
                                  </div>
                                </div>
                              )}

                              <button
                                type="button"
                                onMouseEnter={() => setOpenReactFor(p.id)}
                                onClick={() => reactToPost(p.id, "like")}
                                className={[
                                  "w-full py-2.5 rounded-2xl font-semibold transition border",
                                  p.my_reaction
                                    ? "bg-emerald-500/15 border-emerald-400/20 text-white"
                                    : "bg-white/5 border-white/10 text-white/75 hover:bg-white/10 hover:text-white",
                                ].join(" ")}
                              >
                                {p.my_reaction === "love"
                                  ? "❤️ Me encanta"
                                  : p.my_reaction === "haha"
                                  ? "😂 Me da risa"
                                  : p.my_reaction === "dislike"
                                  ? "👎 No me gusta"
                                  : p.my_reaction === "like"
                                  ? "👍 Me gusta"
                                  : "👍 Like"}
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setOpenComments((prev) => ({ ...prev, [p.id]: true }))
                              }
                              className="
                                flex-1 py-2.5 rounded-2xl
                                border border-white/10
                                bg-white/5
                                text-white/75 font-semibold
                                hover:bg-white/10 hover:text-white
                                transition
                              "
                            >
                              💬 Comment
                            </button>
                          </div>

                          {openComments[p.id] && (
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <input
                                  value={commentDraft[p.id] || ""}
                                  onChange={(e) =>
                                    setCommentDraft((prev) => ({
                                      ...prev,
                                      [p.id]: e.target.value,
                                    }))
                                  }
                                  className="
                                    flex-1
                                    bg-black/25
                                    border border-white/10
                                    rounded-full
                                    px-4 py-2
                                    outline-none
                                    text-sm text-white/85
                                    placeholder:text-white/35
                                    focus:border-emerald-400/30 focus:ring-2 focus:ring-emerald-500/15
                                    transition
                                  "
                                  placeholder="Escribe un comentario..."
                                />
                                <button
                                  type="button"
                                  onClick={() => sendComment(p.id)}
                                  className="
                                    px-4 py-2 rounded-2xl
                                    border border-emerald-400/20
                                    bg-emerald-500/15
                                    text-white/90 font-semibold
                                    hover:bg-emerald-500/25 hover:border-emerald-400/30
                                    transition
                                  "
                                >
                                  Enviar
                                </button>
                              </div>

                              <div className="space-y-2">
                                {p.comments.length > 0 ? (
                                  p.comments.map((c) => (
                                    <div
                                      key={c.id}
                                      className="
                                        rounded-2xl
                                        border border-white/10
                                        bg-black/20
                                        px-4 py-3
                                      "
                                    >
                                      <p className="text-sm font-semibold text-white/85">
                                        {c.user_nombre}
                                      </p>
                                      <p className="text-sm text-white/75">
                                        {c.contenido}
                                      </p>
                                      <p className="text-[11px] text-white/45 mt-1">
                                        {new Date(c.created_at).toLocaleString()}
                                      </p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-white/50">
                                    Sin comentarios aún.
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
