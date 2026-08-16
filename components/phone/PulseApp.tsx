"use client";

import type { RunState } from "@/lib/game/types";
import { med } from "@/lib/game/careers/doctor";
import {
  MAX_FEED,
  canPostThisWeek,
  postContext,
} from "@/lib/game/medical/phone";
import { POSTS } from "@/lib/game/medical/posts";
import {
  followerCount,
  identityOf,
  standingWord,
} from "@/lib/game/medical/social";
import { Avatar } from "../ui/Avatar";
import { EndOfList } from "./EndOfList";
import { PostComposer } from "./PostComposer";

/**
 * Pulse: your standing, the composer, and the feed.
 *
 * The three metrics are shown as separate figures with a word beside each,
 * because "trust 68" means nothing on its own and because a bare colour would
 * be the only signal otherwise.
 */
export function PulseApp({
  state,
  dispatch,
}: {
  state: RunState;
  dispatch: (cmd: string, arg: string) => void;
}) {
  const m = med(state);
  const { social, feed } = m.phone;
  const identity = identityOf(social);
  const ctx = postContext(m, { week: state.week, panel: state.r.panel });
  const canPost = canPostThisWeek(m, state.week);

  const available = POSTS.filter(
    (p) => p.available(ctx) && !(p.once && m.phone.postsMade.includes(p.id)),
  );

  const metrics = [
    {
      label: "Followers",
      value: followerCount(social.followers),
      word: "reach",
    },
    {
      label: "Trust",
      value: `${Math.round(social.trust)}`,
      word: standingWord(social.trust),
    },
    {
      label: "Sentiment",
      value: `${Math.round(social.sentiment)}`,
      word: standingWord(social.sentiment),
    },
  ];

  return (
    <div>
      {/* --------------------------------------------------------- profile */}
      <header className="border-b border-rule/60 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar name="You" handle="@you" you size={44} />
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-tight text-ink">
              {identity.label}
            </p>
            <p className="num text-[12.5px] text-ink-faint">@you</p>
          </div>
        </div>
        <p className="mt-2 text-[13.5px] leading-snug text-ink-soft">
          {identity.blurb}
        </p>

        <dl className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-form border border-rule bg-rule-soft">
          {metrics.map((s) => (
            <div key={s.label} className="bg-card px-2.5 py-2">
              <dt className="sign text-[11.5px] text-ink-faint">{s.label}</dt>
              <dd className="num mt-0.5 text-[17px] font-semibold leading-none text-ink">
                {s.value}
              </dd>
              <dd className="mt-1 text-[12px] leading-none text-ink-faint">
                {s.word}
              </dd>
            </div>
          ))}
        </dl>

        {social.scrutiny >= 25 && (
          <p className="mt-2 rounded-form border border-caution/50 bg-caution-tint px-3 py-1.5 text-[13px] text-caution">
            <span className="sign mr-1.5 text-[11.5px]">Scrutiny</span>
            {Math.round(social.scrutiny)} — you are being watched, and it is
            adding to your malpractice risk each week.
          </p>
        )}
      </header>

      <PostComposer
        posts={available}
        context={ctx}
        canPost={canPost}
        week={state.week}
        onPublish={(id) => dispatch("post", id)}
      />

      {/* ------------------------------------------------------------ feed */}
      {feed.length === 0 ? (
        <p className="px-4 py-8 text-center text-[14px] leading-relaxed text-ink-soft">
          Your feed is empty. Publish something, or wait — the profession talks
          whether or not you join in.
        </p>
      ) : (
        <ul className="divide-y divide-rule/40">
          {feed.map((post) => (
            <li key={post.id} className="px-4 py-3.5">
              <div className="flex items-start gap-2.5">
                <Avatar
                  name={post.author}
                  handle={post.handle}
                  you={post.kind === "player"}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[14.5px] font-semibold text-ink">
                      {post.author}
                    </span>
                    <span className="num text-[12px] text-ink-faint">
                      {post.handle} · wk {post.week}
                    </span>
                    {post.kind === "player" && post.tone === "bad" && (
                      <span className="sign rounded-sm bg-alarm-tint px-1.5 py-0.5 text-[11.5px] text-alarm">
                        Backfired
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-ink-soft">
                    {post.body}
                  </p>
                  <p className="num mt-1.5 text-[12.5px] text-ink-faint">
                    <span aria-hidden>♥</span>{" "}
                    {post.likes.toLocaleString("en-US")}
                    <span className="sr-only"> reactions</span>
                  </p>

                  {post.comments.length > 0 && (
                    <ul className="mt-2 space-y-1.5 border-l border-rule pl-2.5">
                      {post.comments.map((c, i) => (
                        <li key={i} className="text-[13.5px] leading-snug">
                          {/* A comment is one line, so the face is small and
                              sits inline with the name it belongs to. */}
                          <span className="flex items-start gap-2">
                            <Avatar
                              name={c.author}
                              handle={c.handle}
                              size={24}
                              className="mt-0.5"
                            />
                            <span className="min-w-0">
                              <span className="font-semibold text-ink">
                                {c.author}
                              </span>{" "}
                              <span className="text-ink-soft">{c.body}</span>
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          ))}
          <li>
            <EndOfList>
              {feed.length >= MAX_FEED
                ? "Older posts have scrolled off"
                : "You have reached the start of your feed"}
            </EndOfList>
          </li>
        </ul>
      )}
    </div>
  );
}
