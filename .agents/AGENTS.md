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

# Mandatory Testing
Before you run git push to the merge or master branch, you **MUST** run the local headless DOM test to ensure there are no syntax errors or runtime panics on initialization. 

To do this:
1. Run powershell -ExecutionPolicy Bypass -File .\verify_dom.ps1
2. If the script outputs [PASS], you may proceed with the push.
3. If the script outputs [FAIL], you must fix the error before pushing. Do not ask for user permission to fix it, just fix it.

Never skip this step, even for small changes.

### Data Protection Rule
Never use destructive database commands or blind upserts that could accidentally overwrite or erase existing user data. Always check if data exists first before updating.

### Third-Party Ad Policy
Never write code that attempts to block, suppress, detect, or circumvent advertisements served inside the YouTube, Vimeo, Dailymotion, or Twitch embedded player. Ad removal features apply only to WatchOnRepeat's own site-level advertisements (e.g. Google AdSense banners in our UI), never to the embedded video player itself.

### Responsive Design Rule
Every new UI feature must be verified on desktop and mobile layouts before being considered complete.

### Functionality Preservation Rule
When modifying existing functionality, preserve current features and user workflows unless explicitly instructed to change them.

### DOM Manipulation Rule
Avoid destructive DOM operations that unnecessarily recreate elements or break existing event listeners. Prefer targeted updates and preserve component state whenever practical.

### UI Consistency & Polish Rule
When creating UI elements, ensure buttons and interactive components share consistent visual weight, padding, typography, and alignment using a unified CSS class system. Include subtle CSS hover and active micro-animations (like slight scale or color transitions) to make the interface feel dynamic.

### Error Handling Rule
For the WatchOnRepeat project, prefer silent error handling. Unexpected errors should be logged to the browser console with sufficient context for debugging, while the UI should continue functioning whenever possible. Only surface an error to the user when an action cannot be completed or requires their intervention.

### Technology Stack Rule
For the WatchOnRepeat project, always use Vanilla JavaScript, HTML, and standard CSS unless explicitly instructed otherwise. Do not introduce React, Vue, Tailwind CSS, jQuery, or other frontend frameworks.

### State Sync & Verification Rule
Before suggesting a commit or deployment, verify that all affected UI states and user flows have been tested. Database changes should be reflected immediately in the UI without requiring a manual page refresh.

### Data Hydration Rule
When building features that rely on aggregate or global data, explicitly define a single source of truth for data hydration during the application's initial load sequence, rather than scattering lazy-loading logic across disconnected UI tabs.
