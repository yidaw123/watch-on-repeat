
    lucide.createIcons();
    
    const SUPABASE_URL = 'https://golkbcdlxpojjwqtyuzn.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_e1gQuU0n8FofmTkitqTEQQ_pi1g8fqD';
    let supabase = null;
    try {
      if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      }
    } catch(e) {}

    const form = document.getElementById('contact-form');
    const msgInput = document.getElementById('contact-message');
    const countDisplay = document.getElementById('char-count');
    const submitBtn = document.getElementById('submit-btn');
    const successMsg = document.getElementById('success-message');

    msgInput.addEventListener('input', () => {
      countDisplay.textContent = msgInput.value.length;
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const category = document.getElementById('contact-category').value;
      const message = document.getElementById('contact-message').value.trim();
      
      if (!name || !email || !category || !message) return;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i data-lucide="loader" class="spin"></i> Sending...';
      lucide.createIcons();

      try {
        if (supabase) {
          const { error } = await supabase.from('support_tickets').insert({
            user_id: null,
            name,
            email,
            category,
            message
          });
          if (error) {
             console.error("Supabase Error:", error);
          }
        }
        
        await new Promise(r => setTimeout(r, 600));
        
        window.location.href = 'contact-success.html';
        
      } catch (err) {
        console.error(err);
        alert("Failed to send message.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="send"></i> Send Message';
        lucide.createIcons();
      }
    });
  