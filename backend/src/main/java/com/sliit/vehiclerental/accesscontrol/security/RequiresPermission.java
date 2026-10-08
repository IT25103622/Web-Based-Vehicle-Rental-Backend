package com.sliit.vehiclerental.accesscontrol.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Declarative permission gate for controller/service methods, e.g.:
 *
 *   @RequiresPermission("RESET_USER_PASSWORD")
 *   public void resetPassword(Long targetUserId) { ... }
 *
 * Enforced by PermissionAspect, which throws AccessDeniedException
 * (-> HTTP 403) if the authenticated user's role doesn't have this
 * permission code.
 *
 * `anyOf` lets a method be reachable by more than one permission, e.g. a
 * fleet endpoint a Fleet Manager AND an Inspector may both call:
 *   @RequiresPermission(value = MANAGE_FLEET, anyOf = {INSPECT_VEHICLE})
 * passes if the user has MANAGE_FLEET OR INSPECT_VEHICLE (or both).
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface RequiresPermission {
    String value();
    String[] anyOf() default {};
}
