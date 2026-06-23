# Testing Requirements

**CRITICAL BEHAVIORAL RULE:** In the future, for any and all fixes, do NOT just troubleshoot or make changes and then tell the user it is done. Do your due diligence - test it as much as you can and make sure the error no longer exists and everything is running smoothly BEFORE you tell the user it is done or tell the user to test it. Minimize back-and-forth testing.


# Deployment Workflow

**CRITICAL BEHAVIORAL RULE:** This project is now deployed live on Cloudflare Pages. From now on, you must ONLY commit and push code changes to the `staging` branch. NEVER commit or push to `master` unless the user EXPLICITLY commands you to "push to live" or "deploy to production". This ensures all changes can be previewed before affecting live users.
