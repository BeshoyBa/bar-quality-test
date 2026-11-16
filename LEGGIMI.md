# Bar Quality — nuovo sito e pannello amministratore

Questa cartella contiene una nuova versione del sito, predisposta per GitHub Pages e Firebase. Il sito attuale non viene modificato.

## Cosa c'è nel pacchetto
- `index.html`, `styles.css`, `app.js`: sito pubblico responsive, menu, ricerca, carrello e ordine WhatsApp.
- `admin.html`, `admin.css`, `admin.js`: pannello per aggiornare prodotti, descrizioni, prezzi e disponibilità.
- `menu.json`: copia iniziale del menu originale (93 prodotti in 8 categorie), senza il vecchio PIN.
- `firebase-config.js`: configurazione web del progetto Firebase `bar-quality-admin`, con UID del proprietario già inserito.
- `firestore.rules`: regole che consentono lettura pubblica del menu e scrittura solo all'UID amministratore.
- `CNAME`: mantiene `barquality.it`.

## Prima pubblicazione Firebase (una sola volta)
1. Apri https://console.firebase.google.com/ e crea un progetto `Bar Quality`.
2. Aggiungi un'app Web e copia la configurazione Firebase mostrata.
3. La configurazione web Firebase è già inserita in `firebase-config.js`. `apiKey`, `projectId`, `appId` e gli altri campi della configurazione web identificano l’app; non sono password. Non inserire password o chiavi private nel sito.
4. In Firebase Authentication abilita il provider **Email/Password**. Dalla sezione Utenti crea un utente amministratore con la tua email e una password lunga e unica. Non inserire una pagina di registrazione pubblica.
5. L'UID del proprietario già inserito nel pacchetto è `K6s09xCSP5WGaHLX990crsaOXYn1`. Verifica che corrisponda esattamente all'UID del tuo utente nella sezione Authentication > Users.
6. Firestore risulta già creato: non crearne un secondo.
7. Nella scheda **Regole** di Firestore incolla il contenuto aggiornato di `firestore.rules` e premi **Pubblica**. Questo passaggio va fatto nella console Firebase: il pacchetto non pubblica le regole da solo.
8. Carica tutti i file e le cartelle di questo pacchetto nel repository GitHub che pubblica `barquality.it`. Mantieni `CNAME` nella root.
9. Apri `https://barquality.it/admin.html`, accedi con email e password amministratore. Al primo accesso il pannello importa il menu di partenza da `menu.json` nella memoria locale della pagina; premi **Salva modifiche** per pubblicarlo su Firestore. Da quel momento il sito pubblico legge il menu online.

## Come funziona la sicurezza
- Il pannello non contiene password preimpostate né PIN segreti.
- Il pannello usa Firebase Authentication.
- Firestore consente la lettura pubblica del solo documento `menu/current`, necessario a mostrare il menù ai clienti.
- Le regole Firestore autorizzano le modifiche solo all'UID amministratore configurato. Il controllo viene fatto dal database, non soltanto dal JavaScript del browser.
- Ogni altro documento è bloccato per lettura e scrittura.
- Gli ordini continuano ad aprire WhatsApp: il sito non archivia nomi, numeri o indirizzi dei clienti nel database.

## Controlli di sicurezza consigliati
- Attiva la verifica in due passaggi sull'account Google che controlla Firebase e GitHub.
- In GitHub, limita chi può modificare il repository e proteggi il branch principale.
- Non inserire mai password, token GitHub, service account o chiavi private nei file del sito.
- Non aggiungere una funzione di registrazione pubblica al pannello. Crea l'unico utente admin dalla console Firebase.
- Non cambiare le regole Firestore in modalità test. Se un salvataggio viene negato, controlla che l'UID in `firebase-config.js` coincida esattamente con quello in `firestore.rules`.

## Importante
GitHub Pages continua a ospitare il sito. Firebase serve solo per autenticazione e menu dinamico. Non attivare il piano Blaze per questa configurazione di base. Il piano gratuito ha quote e limiti di utilizzo: non è illimitato.

Il file `firebase-config.js` contiene solo la configurazione web pubblica. La protezione effettiva dipende dalle regole Firestore e dall'account amministratore. Proteggi anche l'account Google/Firebase con una password unica e la verifica in due passaggi.

La prima versione mantiene il flusso ordini WhatsApp e non salva ordini sul database. Il pannello modifica i prodotti esistenti, i prezzi, le descrizioni e la disponibilità; può anche aggiungere o eliminare prodotti nelle categorie già presenti. Il carrello mantiene le regole promozionali presenti nei dati originali: consegna a pagamento fino alla soglia gratuita, Margherita in omaggio e sconto studenti. Verifica comunque i valori prima della pubblicazione.

## Dominio e GitHub Pages
Il pacchetto mantiene il file `CNAME` originale. Dopo aver caricato i file, controlla nelle impostazioni Pages del repository che il dominio personalizzato sia ancora `barquality.it` e che **Enforce HTTPS** sia attivo. Non modificare i DNS Dynadot se il dominio è già collegato correttamente.
