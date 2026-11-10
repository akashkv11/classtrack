# Parent assessment results

Save an assessment's marks, then use **Parent results link → Copy Link** on its assessment page. Share the copied link manually. Parents do not need a teacher login.

Parents enter the student's full name as recorded in ClassTrack. Matching ignores capitalisation and extra spaces. If the name matches multiple saved results, the parent must also enter the roll number. The page shows only the matching student's result for that assessment, including absence status and student-specific marks remarks. Anyone holding the link who knows these details can use this lookup.

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

Manually save marks, copy the link, and open it in a private/mobile browser. Check a unique full name, a duplicate name plus roll number, zero marks, absence, a corrected mark, and an invalid name. Disable and regenerate the link and check that previous access stops. Check that the lookup page never shows a student list or teacher navigation.
