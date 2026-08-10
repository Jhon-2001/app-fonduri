import Link from "next/link";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { BulletList, ContentCard, DocSection } from "@/components/ContentCard";

export default function FaqPage() {
  return (
    <div className="min-h-screen pb-16">
      <Header showHome />

      <main className="mx-auto w-full max-w-3xl px-4 pt-2">
        <BackButton />

        <h1 className="mb-6 text-center text-2xl font-bold text-[var(--fg)] sm:text-3xl">
          Întrebări frecvente (FAQ) – ADR Nord-Vest
        </h1>

        <ContentCard>
          <div className="space-y-8">
            <DocSection title="Ce trebuie să aibă pregătit înainte de deschiderea aplicației">
              <h3 className="text-base font-bold text-[var(--fg)]">
                1. Datele instituției – fără improvizații
              </h3>
              <p>Să fie stabilite dinainte, nu „completate pe loc”:</p>
              <BulletList
                items={[
                  "denumirea oficială exactă a instituției (ca în documentele statutare);",
                  "numele reprezentantului legal, exact ca în actele oficiale;",
                  <>
                    adresa de e-mail{" "}
                    <strong className="text-[var(--fg)]">verificată</strong> și
                    accesibilă în timp real (acolo vine confirmarea);
                  </>,
                  "un număr de telefon de contact, chiar dacă este opțional.",
                ]}
              />
              <p>
                <strong className="text-[var(--fg)]">Problemă frecventă:</strong>{" "}
                e-mail introdus greșit → aplicație depusă, dar confirmarea nu
                ajunge.
              </p>

              <h3 className="pt-2 text-base font-bold text-[var(--fg)]">
                2. Fișa de proiect – în forma finală
              </h3>
              <p>Fișa de proiect trebuie:</p>
              <BulletList
                items={[
                  "completată integral;",
                  "verificată intern;",
                  <>
                    salvată într-o{" "}
                    <strong className="text-[var(--fg)]">versiune finală</strong>,
                    nu „draft final v3”.
                  </>,
                ]}
              />
              <p>Să nu existe:</p>
              <BulletList
                items={[
                  "câmpuri lăsate goale „că le completăm la clarificări”;",
                  "variante diferite ale aceleiași fișe în circulație.",
                ]}
              />

              <h3 className="pt-2 text-base font-bold text-[var(--fg)]">
                3. Lista exactă a documentelor de încărcat
              </h3>
              <p>Beneficiarii trebuie să știe dinainte:</p>
              <BulletList
                items={[
                  "ce documente sunt obligatorii;",
                  "ce documente sunt opționale;",
                  "că lipsa unui document obligatoriu poate duce la respingere.",
                ]}
              />
              <p>
                <strong className="text-[var(--fg)]">
                  Recomandare explicită pentru site:
                </strong>{" "}
                toate documentele să fie pregătite într-un{" "}
                <strong className="text-[var(--fg)]">singur folder</strong>, înainte
                de deschiderea aplicației.
              </p>

              <h3 className="pt-2 text-base font-bold text-[var(--fg)]">
                4. Denumirea fișierelor – banal, dar critic
              </h3>
              <p>Fișierele ar trebui:</p>
              <BulletList
                items={[
                  "să aibă denumiri clare și recognoscibile;",
                  "să nu fie „scan0001.pdf” sau „final_final2.docx”.",
                ]}
              />
              <p>
                <strong className="text-[var(--fg)]">Exemplu bun:</strong>{" "}
                Fisa_proiect_DTE_UAT_X.pdf Declaratie_unica_semnata.pdf
              </p>

              <h3 className="pt-2 text-base font-bold text-[var(--fg)]">
                5. Formatul documentelor
              </h3>
              <p>Toate documentele trebuie:</p>
              <BulletList
                items={[
                  "să fie în formate acceptate (PDF);",
                  "să se deschidă corect;",
                  "să nu fie protejate prin parolă.",
                ]}
              />
              <p>
                <strong className="text-[var(--fg)]">Problemă clasică:</strong>{" "}
                fișier încărcat, dar imposibil de deschis la evaluare.
              </p>

              <h3 className="pt-2 text-base font-bold text-[var(--fg)]">
                6. Valoarea solicitată – coerentă și asumată
              </h3>
              <p>Valoarea introdusă în formular:</p>
              <BulletList
                items={[
                  "să fie exprimată în euro;",
                  "să corespundă cu valoarea din documentele atașate;",
                  "să fie realistă raportat la tipul de documentație DTE vizată (SF, DALI, PT etc.).",
                ]}
              />
              <p>
                Neconcordanțele de sumă sunt unul dintre cele mai frecvente motive
                de clarificare sau respingere.
              </p>

              <h3 className="pt-2 text-base font-bold text-[var(--fg)]">
                7. Domeniul de proiect
              </h3>
              <p>Selectare domeniul principal și secundar:</p>
              <BulletList
                items={[
                  "să corespundă conținutului real al fișei de proiect;",
                  "să fie alese înainte, nu „la inspirație”.",
                ]}
              />

              <h3 className="pt-2 text-base font-bold text-[var(--fg)]">
                8. Punctajul prescorat – verificat
              </h3>
              <p>Punctajul prescorat:</p>
              <BulletList
                items={[
                  "trebuie să fie calculat conform metodologiei;",
                  "să nu fie „optimist” sau aproximativ.",
                ]}
              />
              <p>
                Un punctaj trecut greșit nu ajută și poate ridica semne de
                întrebare la evaluare.
              </p>

              <h3 className="pt-2 text-base font-bold text-[var(--fg)]">
                9. Ordinea de depunere contează
              </h3>
              <p>Beneficiarii trebuie să știe explicit:</p>
              <BulletList
                items={[
                  <>
                    fișele de proiect sunt evaluate în{" "}
                    <strong className="text-[var(--fg)]">ordinea depunerii</strong>;
                  </>,
                  "la punctaje egale, ordinea depunerii face diferența;",
                  "redepunerile sunt tratate ca depuneri noi.",
                ]}
              />
              <p>
                <strong className="text-[var(--fg)]">Consecință:</strong> „trimis
                la 10:01” poate conta mai mult decât „trimis la 10:15”.
              </p>

              <h3 className="pt-2 text-base font-bold text-[var(--fg)]">
                10. O singură aplicație, o singură trimitere
              </h3>
              <p>După apăsarea butonului „Trimite”:</p>
              <BulletList
                items={[
                  "aplicația nu mai poate fi modificată;",
                  "nu există „editare ulterioară”.",
                ]}
              />
              <p>De aceea:</p>
              <BulletList
                items={[
                  "nu se recomandă trimiterea „de test”;",
                  "nu se recomandă trimiterea incompletă „ca să fim în sistem”.",
                ]}
              />

              <h3 className="pt-2 text-base font-bold text-[var(--fg)]">
                11. Verificarea finală înainte de „Trimite”
              </h3>
              <p>Beneficiarul trebuie să își pună explicit întrebarea:</p>
              <BulletList
                items={[
                  "toate câmpurile obligatorii sunt completate?",
                  "toate documentele sunt încărcate?",
                  "datele introduse corespund documentelor atașate?",
                ]}
              />
              <p>
                Dacă răspunsul nu e „da” la toate, aplicația nu trebuie trimisă.
              </p>

              <h3 className="pt-2 text-base font-bold text-[var(--fg)]">
                12. Dovada depunerii
              </h3>
              <p>După trimitere, beneficiarul trebuie:</p>
              <BulletList
                items={[
                  "să noteze numărul unic al aplicației;",
                  "să verifice primirea e-mailului de confirmare;",
                  "să păstreze documentele încărcate.",
                ]}
              />
              <p>
                Lipsa confirmării înseamnă că depunerea nu este sigură.
              </p>
            </DocSection>
          </div>
        </ContentCard>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/aplica" className="btn-primary px-5 py-3">
            Depune aplicația
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--surface-2)]"
          >
            Pagina principală
          </Link>
          <Link
            href="/documentatie"
            className="text-sm font-medium text-[var(--brand-blue)] underline"
          >
            Documentație
          </Link>
        </div>
      </main>
    </div>
  );
}
