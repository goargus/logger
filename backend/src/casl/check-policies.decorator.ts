import { SetMetadata } from '@nestjs/common';
import { PolicyHandler } from './types';

/**
 * Metadata key for storing policy handlers
 */
export const CHECK_POLICIES_KEY = 'check_policies';

/**
 * Decorator to define authorization policies for a route
 * 
 * @example
 * // Simple check
 * @CheckPolicies((ability) => ability.can(Action.Read, 'Activity'))
 * 
 * @example
 * // Multiple checks
 * @CheckPolicies(
 *   (ability) => ability.can(Action.Create, 'Activity'),
 *   (ability) => ability.can(Action.Read, 'Entity')
 * )
 * 
 * @example
 * // Class-based handler
 * class ReadActivityPolicy implements IPolicyHandler {
 *   handle(ability: any) {
 *     return ability.can(Action.Read, 'Activity');
 *   }
 * }
 * @CheckPolicies(new ReadActivityPolicy())
 */
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
