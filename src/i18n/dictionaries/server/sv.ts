import type { EmailTemplate } from "@/i18n/emails";
import type { ServerDictionary } from "./en";

const resetPasswordEmail: EmailTemplate = {
  subject: "Återställ ditt lösenord för CV Forge",
  body: ({ name }) => ({
    greeting: `Hej ${name},`,
    paragraphs: [
      "Vi har fått en begäran om att återställa lösenordet till ditt CV Forge-konto. Klicka på knappen nedan för att välja ett nytt lösenord.",
      "Länken gäller i <strong>en timme</strong>. Om det inte var du som begärde återställningen kan du bortse från det här mejlet — ditt lösenord ändras inte.",
    ],
    button: "Återställ mitt lösenord",
    linkFallback: "Om knappen inte fungerar kan du kopiera och klistra in länken i webbläsaren:",
    footer:
      "Du får det här mejlet eftersom någon begärde en lösenordsåterställning för det CV Forge-konto som hör till den här adressen. Var det inte du behöver du inte göra någonting.",
  }),
};

const verificationEmail: EmailTemplate = {
  subject: "Välkommen till CV Forge — bekräfta din e-postadress",
  body: ({ name }) => ({
    greeting: `Hej ${name},`,
    paragraphs: [
      "Välkommen — kul att du är här. Du har skapat ett konto på <strong>CV Forge</strong>, ett verktyg för att bygga tydliga, professionella CV:n som är redo att exporteras.",
      "Innan du kan logga in behöver vi bekräfta att e-postadressen är din. Klicka på knappen nedan för att bekräfta adressen och aktivera kontot.",
    ],
    button: "Bekräfta min e-postadress",
    linkFallback: "Om knappen inte fungerar kan du kopiera och klistra in länken i webbläsaren:",
    footer:
      "Du får det här mejlet eftersom någon skapade ett CV Forge-konto med den här adressen. Var det inte du kan du bortse från mejlet — inget konto aktiveras utan bekräftelse.",
  }),
};

/**
 * Annotated against the English shape, exactly as the client slices are: adding
 * a third email to `en.ts` is a compile error here until it has Swedish words.
 */
export const sv: ServerDictionary = { resetPasswordEmail, verificationEmail };
