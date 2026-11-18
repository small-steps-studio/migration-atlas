# Troubleshooting

## The report says the file is not valid

Migration Atlas splits the file into statements at semicolons, as a database client does: semicolons inside quoted strings, quoted identifiers, dollar-quoted function bodies and comments do not end a statement. A file with no statements is reported as containing no SQL statements. Statements it does not recognise are still counted in the summary by their first word.

## The file is too large

Reports read files up to the size set in `migrationAtlas.maxFileSizeMB` (50 MB by default and at most). VS Code passes files only up to 50 MB to extensions, so a larger file cannot be read by any extension: split it, or save a shorter one.

## The preview does not open

The report always opens as a Markdown document. If the preview stays closed, set `migrationAtlas.openReportsAsPreview` to true and check that the built-in Markdown extension is enabled.

## Pro or the trial does not unlock

Run **Migration Atlas: Show Licence Status**. It tells whether a key is stored, whether it was checked, and how many trial days are left. Details are in [licence.md](licence.md).

## Something else

Run **Migration Atlas: Report A Problem**. It copies a diagnostics block (versions, settings, licence state; no file contents) and opens the issues page.
