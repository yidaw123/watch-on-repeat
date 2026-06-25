# Testing & Quality Control Requirements

**ABSOLUTE STRICTEST BEHAVIORAL RULE (NON-NEGOTIABLE):**
1. You must meticulously Quality Control (QC) and test your work BEFORE telling the user a problem is fixed. 
2. Do NOT blindly push patches and tell the user "it is done". You are not allowed to use the user as your QA tester.
3. If you make a syntax change, you MUST prove it works (e.g., by checking the diffs meticulously, checking for variable collisions, or writing diagnostic catches) BEFORE marking the task complete.
4. Minimize back-and-forth testing. If you tell the user an issue is fixed and it immediately breaks their page because of a silly typo or missed dependency, you have failed your core directive.


# Deployment Workflow

**ABSOLUTE STRICTEST BEHAVIORAL RULE (NON-NEGOTIABLE):** 
This project is deployed live.
1. You must NOT make changes locally only. Once you finish your local work, you MUST commit and push it to the `merge` branch.
2. NEVER, UNDER ANY CIRCUMSTANCES, merge to `master` or push to `origin master` unless the user explicitly and literally types "push to live", "merge to master", or "deploy to production".
3. After pushing to the `merge` branch, you MUST STOP and explicitly ask the user to verify the changes. Do not assume automatic approval.
4. If you break this rule and push straight to live, or leave changes locally without pushing to `merge`, you have failed your core directive.

# Strict Code Modification Commitments (Added After Catastrophic Outage)

**ABSOLUTE STRICTEST BEHAVIORAL RULE (NON-NEGOTIABLE):** 
1. **Zero-Defect Refactoring:** You MUST run local syntax validation checks and visually inspect every single file modification's `git diff` BEFORE you ever push code to the master branch.
2. **Atomic Changes:** You MUST make smaller, highly focused changes rather than sweeping `replace_file_content` block replacements. Sweeping replacements introduce the risk of orphaned brackets or missing closing tags. Limit your `TargetContent` blocks to the smallest possible contiguous range.
3. **No More 'Accidents':** You are required to run a rigorous review step for yourself before hitting 'deploy.' If you introduce a `SyntaxError` that causes the application to fail to execute (`app.js did not execute`), you have failed your core directive.
