# 🌿 Branching Guide

This guide outlines the naming conventions and branching strategies for contributing to this repository.

## 🔢 Branch Naming Convention

We follow a structured naming convention to ensure clarity and traceability:

```bash
<branch_number>-<subgroup>-<contributor>-<short-description>
```

### Components:

- `<branch_number>` → (Check the last branch number in the repository)

- `<subgroup>` → Subgroup identifier 
  - `b` → Backend
  - `f` → Frontend
  - `m` → Mobile
  - `d` → Database
  - `g` → General

- `<contributor>` → Your first name 

- `<short-description>` → Brief summary using hyphens 
    - Use lowercase letters and hyphens to separate words.
    - Avoid spaces, special characters, and underscores.
    - Try to use a maximum of 4 words to keep it concise.
    - Use a verb to indicate the action taken.
    - Example: `add-user-authentication` or `fix-login-error`.

### ✅ Example:

```bash
0004-g-celil-add-branching-guide
0007-b-ozgur-add-register-endpoint
0012-f-ahmet-add-like-button
```