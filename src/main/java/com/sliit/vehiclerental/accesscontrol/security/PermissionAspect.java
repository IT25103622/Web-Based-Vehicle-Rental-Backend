package com.sliit.vehiclerental.accesscontrol.security;

import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.JoinPoint;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Cross-cutting authorization check. This is what makes Access Control a
 * "layer underneath all six other functions": annotate any method anywhere
 * in the merged system with @RequiresPermission("SOME_CODE") and it is
 * gated here, without that module needing to know how RBAC works.
 */
@Aspect
@Component
public class PermissionAspect {

    @Before("@annotation(requiresPermission)")
    public void checkPermission(JoinPoint joinPoint, RequiresPermission requiresPermission) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw new AccessDeniedException("Not authenticated");
        }

        String required = requiresPermission.value();
        if (!principal.getPermissionCodes().contains(required)) {
            throw new AccessDeniedException(
                    "Role '" + principal.getRoleName() + "' lacks required permission: " + required);
        }
    }
}
