# Product Manager UAT Checklist

Use this checklist for every feature note.

## General UX

- Can a non-technical user understand the screen or workflow?
- Are labels business-friendly?
- Is the empty state clear?
- Is the error state clear?
- Is success feedback clear?
- Is the workflow complete end-to-end?

## Inventory Operations

- Does the feature support real inventory or IT asset management work?
- Does it preserve history for important actions?
- Does it avoid ambiguous ownership, custody, or stock state?
- Does it expose enough information for audit and compliance review?

## Data And Security

- Is tenant isolation preserved?
- Are protected actions permission checked?
- Are important mutations audit logged?
- Are validation errors understandable?
- Are destructive actions blocked or clearly confirmed?

## Completion Result

Each feature note must record:

- UAT status: `not_started`, `passed`, `passed_with_gaps`, or `blocked`.
- Manual QA result.
- Known product gaps.
