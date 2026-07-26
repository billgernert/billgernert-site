# Studying Like the Lab: a Spaced-Repetition Platform for Interview Prep

*A small web app that turns a pile of "things I should know" into a scheduled, graded, gap-targeting practice loop, built the same way the rest of the lab is built.*

---

## The Problem

Interview prep has a shape that ordinary study apps get wrong. It is not a flashcard deck of facts. The questions that matter come in depths: name the concept, explain the mechanism, apply it to a case, and then design or troubleshoot a realistic scenario under pushback. You can "know" Kubernetes services at the first depth and fall apart at the fourth. And the topics are not equally worth your time. Some are in demand and you are weak at them, and those are exactly the ones a generic scheduler buries.

I wanted a tool that scheduled review the way spaced repetition does, but graded across depth levels, tagged *why* an answer was wrong, and spent its limited attention on the gaps that actually matter. I also wanted it to be honest about failure: a skipped day should not quietly preserve a long interval, and a grading budget that runs out should degrade gracefully rather than drop a session on the floor.

## The Shape of a Concept

Everything hangs off a concept. A concept has an identity, a topic, edges to its prerequisites and neighbours, and four depth levels, each with a question prompt and a grading rubric. The concept bank is plain YAML validated against a schema in CI, so a malformed concept cannot merge. Content is generic on purpose. Even though the app is private, the practice material is portable knowledge, and any lab-specific detail is scrubbed out before it is ever stored, so a concept never carries an internal address or a piece of topology.

That last point turned out to matter twice. The bank is hand-authored for the fundamentals, but scenario cards are seeded from real incidents so that practice answers double as war stories. Those generated cards run through a fail-closed public-safety scrub before they are written: if a draft carries any internal identifier, the generator refuses it. The war story survives; the internal detail does not.

## Scheduling That Tells the Truth

The scheduler is a small, pure module: given a card's state and a score, it returns the next interval using the classic spaced-repetition ladder, and it gates depth. A card only graduates a level on a passing score; a failure holds the boundary and schedules remediation right there. A skipped card takes an honest lapse penalty rather than keeping its comfortable interval. Because the whole thing is pure, it is covered by offline tests instead of hope.

On top of that sits a weighting layer. Two signals push a topic up the queue: the concept graph, and demand. If several sibling concepts under a shared parent keep getting missed, the misses are probably a gap in the parent, so the parent resurfaces at the foundational level. And job-market demand, joined against personal accuracy, surfaces the topics that are both wanted and weak. High demand plus low accuracy is the definition of a worthwhile gap.

## Grading, and Knowing When to Stop Spending

Multiple-choice answers are graded locally and for free. Free-text and scenario answers go to a language model against the concept's rubric, which also tags the kind of wrongness: a terminology gap, a mechanism misunderstanding, a confusion with an adjacent concept, or an incomplete depth. Those tags feed the graph roll-up and the contrast questions that pull two easily-confused ideas apart.

The model calls sit behind a fail-closed budget gate. If the monthly budget is missing, unreadable, or spent, the gate denies rather than allows, and the cheap multiple-choice path keeps running so the day is not wasted. The same discipline shows up in interview mode: a timed session where the model plays interviewer, asks follow-ups, and writes a structured scorecard across communication, depth, accuracy, and structure. If the budget trips mid-interview, the session is wrapped and scored from what was covered. A half-interview still leaves a scorecard, never nothing.

## Built Like the Rest of the Lab

The platform did not get a special path. The database is a schema managed by numbered migrations. Secrets are fetched at runtime from a vault, never committed. The API is a small service built in-cluster and deployed by the GitOps reconciler behind single sign-on at the edge. Dashboards are committed as code and validated for structure, then eyeballed live before anyone calls them done. The pure decision logic is offline-tested; the framework and the network are thin edges around it.

That is the part I am proudest of. The study tool is not a toy bolted on the side. It reuses the same credit gate, the same secret custody, the same deploy and dashboard patterns, and the same scrub discipline as the infrastructure work it sits next to. It was cheaper to build because those patterns already existed, and it is safer to run for the same reason.

## What It Taught Me

Spaced repetition is easy to describe and easy to get subtly wrong. The interesting decisions were all about honesty: not inflating a streak across a gap, not letting a skipped card keep its interval, not dropping a session when the money ran out, and not letting a single internal string leak into study content that is meant to be portable. Getting those right is the difference between a demo and something I actually use to prepare.
