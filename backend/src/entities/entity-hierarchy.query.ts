import { Repository } from 'typeorm';
import { Entity } from './entity.entity';

const ENTITY_COLUMNS = [
  'id',
  'name',
  'type',
  'code',
  'description',
  'location',
  'currency_symbol',
  'is_active',
  'term_length_years',
  'parent_id',
  'created_at',
  'updated_at',
];

const ENTITY_SELECT = ENTITY_COLUMNS.map((column) => `e.${column}`).join(', ');
const ENTITY_TREE_SELECT = ENTITY_COLUMNS.join(', ');

type EntityTreeCteOptions = {
  includePath: boolean;
  onlyActiveDescendants: boolean;
};

function buildEntityTreeCte({ includePath, onlyActiveDescendants }: EntityTreeCteOptions): string {
  const pathSelect = includePath ? ', 0 AS depth, ARRAY[e.name] AS path' : '';
  const pathRecursive = includePath ? ', et.depth + 1 AS depth, et.path || e.name' : '';
  const descendantsFilter = onlyActiveDescendants ? 'WHERE e.is_active = true' : '';

  return `WITH RECURSIVE entity_tree AS (
  SELECT ${ENTITY_SELECT}${pathSelect}
  FROM entities e
  WHERE e.id = $1

  UNION ALL

  SELECT ${ENTITY_SELECT}${pathRecursive}
  FROM entities e
  INNER JOIN entity_tree et ON e.parent_id = et.id
  ${descendantsFilter}
)`;
}

export async function fetchEntityHierarchyIds(
  repo: Repository<Entity>,
  rootId: string,
): Promise<string[]> {
  const cte = buildEntityTreeCte({ includePath: false, onlyActiveDescendants: false });
  const rows = await repo.query(`${cte}
SELECT id FROM entity_tree;`, [rootId]);
  return rows.map((row: { id: string }) => row.id);
}

export async function fetchActiveDescendants(repo: Repository<Entity>, rootId: string): Promise<Entity[]> {
  const cte = buildEntityTreeCte({ includePath: true, onlyActiveDescendants: true });
  const rows = await repo.query(
    `${cte}
SELECT ${ENTITY_TREE_SELECT}
FROM entity_tree
ORDER BY depth ASC, path ASC;`,
    [rootId],
  );

  return rows as Entity[];
}
