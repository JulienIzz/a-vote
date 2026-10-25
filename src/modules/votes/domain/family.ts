/** Une famille politique stable à travers les législatures, dans l'ordre d'affichage. */
export interface Family {
  id: string;
  label: string;
  shortLabel: string;
  /** Couleur hexadécimale. */
  color: string;
  /** Rang d'affichage, de la gauche vers la droite de l'hémicycle. */
  order: number;
}
