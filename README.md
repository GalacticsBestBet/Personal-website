# Personal External Brain

## Setup & Testing
1.  **Omgeving:** Maak een file `.env.local` aan in deze map.
2.  **Configuratie:** Kopieer de URL en ANON_KEY uit je Supabase dashboard:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=jouw-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw-key
    ```
    (Gebruik `.env.local.example` als voorbeeld).
3.  **Starten:**
    Open je terminal in deze map en typ:
    ```bash
    npm run dev
    ```
    (Je hoeft geen `nodemon` te gebruiken, Next.js herlaadt automatisch).
4.  **Openen:**
    Ga in je browser naar `http://localhost:3000`.

## Features
- **Quick Input:** Typ iets in de balk onderaan en druk op Enter.
- **Inbox:** Je items verschijnen direct in de lijst via Supabase.
