Cross-area rules; local rules stay in section comments.
# Architecture rules

ABSOLUTE RULES — never compress, reword or remove these.
Never run SQL. Ben runs every statement by hand.
Never write a migration or a migration file.
Never touch feed_config.
round_pool_cap stays at 30.
Any unexpected test failure: STOP AND REPORT. Never edit a test to make it pass unless a brief explicitly authorises that exact change.

## Tests
Every test deleted, renamed or rewritten is named in the build report, with its assertion quoted and one line on why. A brief that changes a documented rule implicitly authorises updating the test encoding it; it never authorises doing so silently. State the test count before and after; every difference must reconcile by name.

Copy every react-i18next mock in full from src/test/profileCoursesRecord.test.tsx:33: initReactI18next is required at module load; t returns defaultValue or ''. Assert structure, not translated words; never change components for mocks.

When AGENTS.md approaches its limit, always move an architecture note into a file header, never compress a rule. A fact about how one module behaves belongs next to that module. AGENTS.md holds only what cannot live in a header: cross-cutting process rules.

Source-specific architecture rules live in `src/AGENTS.md`; read it before changing files under `src/`.

## Briefs

Three rules learned the hard way, each from a repeated failure.

### 1. What "ANY NEW FAILURE IS STOP AND REPORT" means

STOP for: a test that fails once the work is complete; a type or build error that SURVIVES the finished edit; a clause that contradicts another clause or the attached mock; data the brief assumes and the codebase does not have.

DO NOT STOP for: an intermediate compile state inside your own multi-file edit — finish it, then compile, then report; a clause you disagree with — report it alongside the finished work; a check your environment cannot run — name it and carry on past it.

When you do stop, the report carries the error itself: the file, the line, and the compiler's or runner's own words. "A preview type error" is not something that can be ruled on, and asking for it costs a round trip.

A stop that halts four unrelated sections because of one sentence of copy is a badly scoped stop. Build what the stop does not block.

### 2. A mock must provide everything the module under test imports

PREFER A REAL PROVIDER TO A HAND-WRITTEN MOCK. MemoryRouter over a useNavigate mock, a real provider over a stubbed hook. A provider cannot be partially wrong.

If you must mock, copy the whole thing. A mock missing one export is not a smaller mock, it is a broken one: the module still imports what the mock left out, and the failure surfaces in an unrelated file. react-i18next must always include initReactI18next:

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

That t returns the defaultValue or an empty string, never a translation. Assert on structure, not on translated words, and never add a defaultValue to a component to make a test pass.

Do not convert existing passing tests to a different pattern for consistency. Churning green tests is not worth the risk.

### 3. When a brief's rule and its drawing disagree, stop and ask

A signed-off mock is the spec, and so is a stated rule. When the two conflict — a rule saying "exclude the viewer from every figure" beside a drawn sentence that counts the viewer — DO NOT PICK ONE. Both come from the same author and one of them is a mistake. Report the conflict with both quoted, and wait.

This has happened four times and been caught every time by the builder, never by the author. It is expected behaviour, not pedantry.

### Reporting counts

Report the suite total before and after, and name where any delta came from. A count that moves while the report says "unchanged" hides a real change, and a baseline taken from a number that moved underneath you is how two reports in a row can both be wrong.
