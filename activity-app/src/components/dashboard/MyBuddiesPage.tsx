"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, MapPin, MoreVertical, Search, Trash2, UsersRound } from "lucide-react";
import { ApiError } from "@/service/AuthService";
import {
  getMyBuddies,
  removeBuddy,
  type BuddyListItem,
} from "@/service/buddyService";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { confirmAction } from "@/src/lib/confirmAction";

const PAGE_SIZE = 20;

export default function MyBuddiesPage() {
  const { notify } = useAuth();
  const [buddies, setBuddies] = useState<BuddyListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [removingBuddyId, setRemovingBuddyId] = useState<string | null>(null);
  const menuContainerRef = useRef<HTMLUListElement>(null);

  const loadBuddies = useCallback(async (nextOffset: number, append: boolean) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    setLoadError("");

    try {
      const response = await getMyBuddies(PAGE_SIZE, nextOffset);
      setBuddies((current) => append
        ? [...current, ...response.items]
        : response.items);
      setTotal(response.total);
      setOffset(nextOffset);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Unable to load your buddies.";
      setLoadError(message);
      if (!(error instanceof ApiError && error.status === 401)) {
        notify(message, "error");
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [notify]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadBuddies(0, false), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadBuddies]);

  useEffect(() => {
    const closeMenuOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !menuContainerRef.current?.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    const closeMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenuId(null);
    };

    document.addEventListener("mousedown", closeMenuOnOutsideClick);
    document.addEventListener("keydown", closeMenuOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenuOnOutsideClick);
      document.removeEventListener("keydown", closeMenuOnEscape);
    };
  }, []);

  const handleRemoveBuddy = async (buddy: BuddyListItem) => {
    setOpenMenuId(null);
    const confirmed = await confirmAction({
      title: `Remove ${buddy.user.full_name} from your buddies?`,
      text: "You can add this person as a buddy again later.",
      confirmButtonText: "Remove buddy",
      confirmButtonColor: "#dc2626",
    });
    if (!confirmed) return;

    setRemovingBuddyId(buddy.user.id);
    try {
      await removeBuddy(buddy.user.id);
      setBuddies((current) => current.filter((item) => item.user.id !== buddy.user.id));
      setTotal((current) => Math.max(0, current - 1));
      notify("Buddy removed.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to remove buddy.";
      if (!(error instanceof ApiError && error.status === 401)) {
        notify(message, "error");
      }
    } finally {
      setRemovingBuddyId(null);
    }
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredBuddies = buddies.filter(({ user }) =>
    [user.full_name, user.location, user.bio]
      .some((value) => value?.toLowerCase().includes(normalizedSearch))
  );

  return (
    <div className="space-y-4 rounded-3xl bg-[#F1F5F9] p-4 sm:p-6">
      <header className="flex flex-col gap-4 px-1 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <UsersRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-neutral-900 sm:text-xl">
              My Buddies
            </h1>
          </div>
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Search buddies</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search"
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-neutral-800 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          />
        </label>
      </header>

      {loadError ? (
        <section className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700 shadow-sm" role="alert">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => void loadBuddies(0, false)}
            className="mt-3 font-bold text-orange-600 hover:text-orange-700"
          >
            Try again
          </button>
        </section>
      ) : isLoading && buddies.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-neutral-500 shadow-sm" role="status">
          Loading your buddies…
        </section>
      ) : buddies.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <UsersRound className="mx-auto h-9 w-9 text-neutral-300" />
          <h2 className="mt-4 text-base font-bold text-neutral-800">No buddies yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
            When you add people as buddies, they’ll show up here.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
          >
            Explore plans <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      ) : filteredBuddies.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-neutral-500 shadow-sm">
          No buddies match “{searchQuery}”.
        </section>
      ) : (
        <>
          <ul ref={menuContainerRef} className="space-y-2">
            {filteredBuddies.map((buddy) => {
              const { user, created_at } = buddy;
              const isMenuOpen = openMenuId === user.id;
              const isRemoving = removingBuddyId === user.id;

              return (
                <li
                  key={user.id}
                  className="relative flex min-h-[76px] items-center rounded-xl border border-slate-200/90 bg-white px-3 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:px-4"
                >
                  <Link
                    href={`/dashboard/profile/${user.id}`}
                    className="group flex min-w-0 flex-1 items-center gap-3 py-2 pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30"
                  >
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt=""
                        width={48}
                        height={48}
                        unoptimized
                        className="h-12 w-12 shrink-0 rounded-full border border-neutral-100 bg-neutral-100 object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-base font-black text-orange-700"
                      >
                        {user.full_name.trim().charAt(0).toUpperCase() || "B"}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-neutral-900 group-hover:text-orange-700">
                        {user.full_name}
                      </span>
                      <span className="mt-0.5 flex min-w-0 items-center gap-1 truncate text-xs text-neutral-500">
                        {user.location && (
                          <>
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{user.location}</span>
                          </>
                        )}
                        {user.location && user.bio && <span aria-hidden="true">•</span>}
                        {user.bio && <span className="truncate">{user.bio}</span>}
                      </span>
                    </span>
                  </Link>
                  <span className="hidden shrink-0 px-3 text-xs text-neutral-500 sm:block">
                    {new Date(created_at).toLocaleDateString()}
                  </span>
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      aria-label={`Actions for ${user.full_name}`}
                      aria-haspopup="menu"
                      aria-expanded={isMenuOpen}
                      disabled={isRemoving}
                      onClick={() => setOpenMenuId(isMenuOpen ? null : user.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-orange-50 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 disabled:opacity-50"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {isMenuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 top-full z-20 mt-1 min-w-40 overflow-hidden rounded-xl border border-neutral-200 bg-white p-1 shadow-lg"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => void handleRemoveBuddy(buddy)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove buddy
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {buddies.length < total && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void loadBuddies(offset + PAGE_SIZE, true)}
                disabled={isLoadingMore}
                className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-wait disabled:opacity-60"
              >
                {isLoadingMore ? "Loading…" : "Load more buddies"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
