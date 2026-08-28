import type { AuthErrors } from "@/i18n/authErrors";
import type { Dictionary } from "../en";

const errors: AuthErrors = {
  EMAIL_NOT_VERIFIED:
    "Den här e-postadressen är inte verifierad än. Leta efter verifieringslänken i din inkorg.",
  INVALID_EMAIL_OR_PASSWORD: "Fel e-postadress eller lösenord.",
  INVALID_EMAIL: "Det där ser inte ut som en giltig e-postadress.",
  USER_ALREADY_EXISTS: "Det finns redan ett konto med den e-postadressen.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "Det finns redan ett konto med den e-postadressen.",
  PASSWORD_TOO_SHORT: "Lösenordet är för kort.",
  PASSWORD_TOO_LONG: "Lösenordet är för långt.",
  FAILED_TO_CREATE_USER: "Kontot kunde inte skapas. Försök igen.",
  INVALID_TOKEN: "Länken är inte giltig.",
  TOKEN_EXPIRED: "Länken har gått ut.",
  SOCIAL_ACCOUNT_ALREADY_LINKED:
    "Det Google-kontot är redan kopplat till ett annat konto här.",
  fallback: "Något gick fel. Försök igen.",
};

export const auth: Dictionary["auth"] = {
  errors,

  or: "eller",
  continueWithGoogle: "Fortsätt med Google",

  showPassword: "Visa lösenord",
  hidePassword: "Dölj lösenord",

  passwordMismatch: "Lösenorden stämmer inte överens.",

  signIn: {
    title: "Logga in",
    email: "E-post",
    password: "Lösenord",
    forgotPassword: "Glömt lösenordet?",
    submit: "Logga in",
    submitting: "Loggar in…",
    verified: "E-postadressen är verifierad — du kan logga in nu.",
    reset: "Lösenordet är uppdaterat — du kan logga in med det nya lösenordet nu.",
    noAccount: "Har du inget konto?",
    createOne: "Skapa ett",
  },

  signUp: {
    title: "Skapa konto",
    name: "Fullständigt namn",
    email: "E-post",
    password: "Lösenord",
    confirmPassword: "Bekräfta lösenord",
    submit: "Skapa konto",
    submitting: "Skapar konto…",
    verificationSendFailed:
      "Kontot skapades, men verifieringsmejlet kunde inte skickas. Försök igen från inloggningssidan.",
    haveAccount: "Har du redan ett konto?",
    signIn: "Logga in",

    // Bestämd form — "i integritetspolicyn", inte "i integritetspolicy" —
    // vilket är just varför den här nyckeln inte delas med footer.privacy.
    privacyNotice:
      "Genom att skapa ett konto godkänner du hur dina uppgifter hanteras, vilket beskrivs i {privacyPolicy}.",
    privacyPolicy: "integritetspolicyn",

    sent: {
      title: "Kolla din e-post",
      body: "Vi har skickat en verifieringslänk till {email}. Klicka på länken för att aktivera kontot.",
      backToSignIn: "Tillbaka till inloggningen",
    },
  },

  forgotPassword: {
    title: "Glömt lösenordet",
    intro:
      "Ange din e-postadress så skickar vi en länk för att återställa lösenordet.",
    email: "E-post",
    submit: "Skicka återställningslänk",
    submitting: "Skickar…",
    backToSignIn: "Tillbaka till inloggningen",

    sent: {
      title: "Kolla din e-post",
      body: "Om {email} är registrerad får du en återställningslänk inom kort.",
    },
  },

  resetPassword: {
    title: "Välj ett nytt lösenord",
    password: "Nytt lösenord",
    confirmPassword: "Bekräfta nytt lösenord",
    submit: "Spara nytt lösenord",
    submitting: "Sparar…",

    invalid: {
      title: "Ogiltig länk",
      body: "Länken för att återställa lösenordet är ogiltig eller har gått ut. Begär en ny.",
      request: "Begär en ny länk",
    },
  },
};
