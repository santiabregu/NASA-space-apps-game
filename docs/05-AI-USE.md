# AI Usage Declaration

> This document states where and how artificial intelligence tools were used to build **Stellar Strategy**,
> and how the team reviewed that work.

---

## 1. Summary

AI tools were used as **assistants**, never as the final decision-maker. Every piece of AI-assisted output
(code, text and images) was read, tested and approved by a team member before it became part of the project.
The game design, the mission rules and the final choices are the team's own work.

## 2. Where AI was used

| Area | How AI helped | Human role |
|---|---|---|
| **Source code** (frontend and backend) | An AI coding assistant (Claude Code, by Anthropic) suggested and drafted code, refactors and unit tests. | The team defined every feature, reviewed each change line by line, ran the tests and play-tested the result before keeping it. |
| **Documentation** | AI helped draft and proofread parts of the documents in `docs/` and in-game texts. | The team wrote the content and structure, and edited the final wording. |
| **Images** | Some visual assets (mission banners, part illustrations and backgrounds) were created or edited with AI image tools, then converted and resized for the game. | The team chose, curated and adjusted every image. AI images are illustrations, not real photographs of NASA missions. |
| **Scientific content** | AI helped summarise public information about orbits, rockets and space missions. | Every figure and fact used in missions, the Academy and quiz questions was checked against public sources (NASA and other space agencies) before being added. |

## 3. How AI output was reviewed

- **Code review:** no AI-generated code was merged without a team member reading and understanding it.
- **Testing:** backend logic is covered by automated unit tests, and the full game flow was played manually
  (sign-up, tutorial, missions, multiplayer) after each relevant change.
- **Fact-checking:** numbers shown to the player (costs, orbit altitudes, engine data, historical facts)
  were verified against public sources.
- **Security:** authentication and data-handling code was reviewed with extra care; secrets are never
  generated or stored by AI tools.

## 4. What AI was not used for

- AI did not make the game-design decisions or define the project goals.
- No NASA logos or official imagery were altered or imitated with AI.
- No player data is sent to AI services by the game; the game itself does not use AI at runtime.

## 5. Responsibility

The team takes full responsibility for all the content in this repository, including any part created with
the help of AI tools.
