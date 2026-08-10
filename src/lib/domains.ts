export type DomainOption = {
  id: string;
  label: string;
  icon: "leaf" | "bolt" | "bus" | "road" | "book" | "urban" | "rural";
  subdomains: string[];
};

export const DOMAINS: DomainOption[] = [
  {
    id: "2.7",
    label: "2.7 - Infrastructura verde",
    icon: "leaf",
    subdomains: [
      "Infrastructura verde - municipii reședință de județ",
      "Infrastructura verde – altele decât municipiile reședință de județ",
    ],
  },
  {
    id: "2.1",
    label: "2.1 - Eficiență energetică",
    icon: "bolt",
    subdomains: [
      "Eficiență energetică în clădiri publice",
      "Eficiență energetică în locuințe colective",
    ],
  },
  {
    id: "2.8",
    label: "2.8 - Mobilitate urbană",
    icon: "bus",
    subdomains: [
      "Transport public urban",
      "Infrastructură pentru mobilitate activă",
    ],
  },
  {
    id: "3.2",
    label: "3.2 - Infrastructura rutieră",
    icon: "road",
    subdomains: [
      "Drumuri județene",
      "Drumuri de interes local",
    ],
  },
  {
    id: "4.2",
    label: "4.2 - Educație",
    icon: "book",
    subdomains: [
      "Infrastructură educațională preuniversitară",
      "Infrastructură educațională universitară",
    ],
  },
  {
    id: "5.1",
    label: "5.1 - Regiune atractivă URBAN",
    icon: "urban",
    subdomains: [
      "Regenerare urbană - municipii reședință de județ",
      "Regenerare urbană - altele decât municipiile reședință de județ",
      "Patrimoniu urban",
      "Turism urban",
      "Infrastructură turistică all season - urban",
    ],
  },
  {
    id: "5.2",
    label: "5.2 - Regiune atractivă RURAL",
    icon: "rural",
    subdomains: [
      "Regenerare rurală și patrimoniu rural",
      "Turism rural și infrastructură turistică",
    ],
  },
];
