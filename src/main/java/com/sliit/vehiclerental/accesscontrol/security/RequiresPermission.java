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
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface RequiresPermission {
    String value();
}
