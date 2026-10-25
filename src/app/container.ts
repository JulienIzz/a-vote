/** Câblage du site : les dépôts embarqués et le store des réponses, instanciés une fois. */
import { createAnswersStore } from '#src/modules/answers/domain/store.ts';
import { createKeyValuePersistence, webStorage } from '#src/modules/answers/infra/key-value-persistence.ts';
import { methodologyRepository } from '#src/modules/methodology/infra/data-source.ts';
import { questionRepository } from '#src/modules/questions/infra/data-source.ts';
import { voteRepository } from '#src/modules/votes/infra/data-source.ts';

/** Nombre de questions d'un parcours. */
export const DECK_SIZE = 25;

/** Nombre de questions ajoutées à chaque fois qu'on prolonge un parcours terminé, pour affiner les scores. */
export const EXTENSION_SIZE = 10;

/** Le site ne propose que les fiches relues ou publiées ; `true` y ajoute les brouillons (relecture). */
export const INCLUDE_DRAFTS = false;

const storage = webStorage();
export const answersStore = createAnswersStore(storage ? { persistence: createKeyValuePersistence(storage) } : {});

export { methodologyRepository, questionRepository, voteRepository };
