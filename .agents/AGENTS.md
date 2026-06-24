# Testing & Quality Control Requirements

**ABSOLUTE STRICTEST BEHAVIORAL RULE (NON-NEGOTIABLE):**
1. You must meticulously Quality Control (QC) and test your work BEFORE telling the user a problem is fixed. 
2. Do NOT blindly push patches and tell the user "it is done". You are not allowed to use the user as your QA tester.
3. If you make a syntax change, you MUST prove it works (e.g., by checking the diffs meticulously, checking for variable collisions, or writing diagnostic catches) BEFORE marking the task complete.
4. Minimize back-and-forth testing. If you tell the user an issue is fixed and it immediately breaks their page because of a silly typo or missed dependency, you have failed your core directive.


# Deployment Workflow

**ABSOLUTE STRICTEST BEHAVIORAL RULE (NON-NEGOTIABLE):** 
This project is deployed live on Cloudflare Pages. 
1. You must ONLY commit and push code changes to the `staging` branch or a feature branch. 
2. NEVER, UNDER ANY CIRCUMSTANCES, merge to `master` or push to `origin master` unless the user explicitly and literally types "push to live", "merge to master", or "deploy to production".
3. After pushing to `staging`, you MUST STOP and explicitly ask the user to verify the changes. Do not assume automatic approval.
4. If you break this rule, you have failed your core directive.
