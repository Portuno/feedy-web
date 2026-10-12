# Notas de compatibilidad con Supabase

No se cambió el esquema. Cosas a tener en cuenta:

1. **Fecha de la edición del día**: web y app usan la fecha *local del dispositivo* (`LocalDate.now()` / `hoyISO()`). Si dos dispositivos están en husos distintos podrían caer en ediciones de días distintos. Con `unique (diario_id, fecha)` nunca se duplica una edición del mismo día.
2. **Número de edición**: se calcula en el cliente (máximo + 1). Si web y app crean la primera edición del día al mismo tiempo, una falla por el unique y se reusa la existente (mismo comportamiento que Android). Para numeración 100 % atómica haría falta una función `edicion_del_dia(diario uuid)` security definer — no creada.
3. **Diario automático al registrarse**: se crea desde el cliente ("{Nombre} Times", lema "Las noticias de la casa"). Si la app Android usa otro lema por defecto, conviene igualarlo (`LEMA_POR_DEFECTO` en `src/data.ts`). Alternativa robusta: hacerlo en el trigger `handle_new_user` (requiere migración).
4. **Realtime de aplausos y cartas** no puede filtrarse por diario (esas tablas no tienen `diario_id`), así que cualquier aplauso visible dispara una recarga. Es lo mismo que hace la app.
5. **Respuestas a avisos y lecturas** no están en la publicación realtime; se ven al recargar la pantalla.
6. **canjear_codigo** devuelve el uuid del diario; la web lo deja como diario activo y abre su portada (`/{slug}`).
7. **Slug**: lo pone el trigger `asignar_slug` si el insert no lo trae. La app Android no manda la columna. Renombrar el diario no cambia la URL.
8. **Push**: la tabla `push_suscripciones` la escribe cada usuario sobre sus filas. El envío lo hace la función `avisar-edicion` con la service role, al insertarse una edición. Una segunda nota el mismo día no crea edición y no manda otro aviso.
