# Parent assessment results

Save an assessment's marks, then use **Parent results link → Copy Link** on its assessment page. Share the copied link manually. Parents do not need a teacher login.

Parents enter at least two characters from the student's name. First names, surnames, and name fragments are accepted, ignoring capitalisation and extra spaces. A unique match opens the result directly. When several students match, parents select from full names and roll numbers; even identical full names can be distinguished by roll number. Marks and remarks are shown only for the selected student. Only students with saved results in the linked assessment appear, and no student list appears before a search. Anyone holding the link can search for matching student names and view a selected result.

Corrections appear at the same link after saving. **Disable Link** stops public lookup; saving again does not enable it. **Enable Link** restores access. **Regenerate Link** replaces the link and invalidates the old one. Links have no automatic expiry. Existing assessments can use **Generate Link** when they already have saved marks.

## Deployment

Apply migrations before serving the new application version:

```bash
npm run deploy:migrate
npm run build
```

Migration `20261111050000_add_assessment_sharing` adds nullable unique share tokens and an initially disabled sharing flag. It does not publish existing assessments or change saved marks. The existing `build:netlify` command already migrates before building.

## Verification

```bash
npm run typecheck
npm run lint
RUN_PARENT_RESULTS_DB_TESTS=1 node --import tsx --env-file=.env --test lib/assessments/sharing.integration.test.ts
```

Run integration tests against a migrated development database. They create synthetic records and delete their fixtures afterward; without the opt-in variable the database tests are skipped.

Manually save marks, copy the link, and open it in a private/mobile browser. Check a unique partial name, a search matching several students, identical full names distinguished by roll number, case and spacing differences, zero marks, absence, a corrected mark, and a short or unmatched name. Change the search text and confirm previous matches and results clear. Disable and regenerate the link and check that previous access stops. Check that the lookup page shows only matching names after a search, no marks until selection when multiple students match, and no teacher navigation.
