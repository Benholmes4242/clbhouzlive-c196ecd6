/**
 * Maps the Discover region toggle slug to its natural-language phrase
 * used inside dynamic section titles like "Toughest courses {scope}".
 */
export function regionScopePhrase(slug: string | null | undefined): string {
  switch (slug) {
    case 'uk-ireland':
      return 'in GB&I';
    case 'usa':
      return 'in the USA';
    case 'continental-europe':
      return 'in Europe';
    case 'rest-of-world':
      return 'in the rest of the world';
    case null:
    case undefined:
    default:
      return 'in the world';
  }
}
