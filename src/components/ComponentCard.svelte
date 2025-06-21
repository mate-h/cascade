<script lang="ts">
  import { formatComponentData } from "../utils/ecs";

  let { componentType, component, ecs, onEntitySelect } = $props();

  const formattedData = $derived(formatComponentData(component, ecs));

  function handleInteraction(event: Event) {
    const target = event.target as HTMLElement;
    if (target.classList.contains("entity-ref")) {
      event.preventDefault();
      event.stopPropagation();

      const entityId = target.getAttribute("data-entity-id");
      if (entityId) {
        // Add active state to the clicked reference
        target.classList.add("active");
        setTimeout(() => target.classList.remove("active"), 150);

        // If we have an entity selection handler, use it
        if (onEntitySelect) {
          onEntitySelect(parseInt(entityId));
        } else {
          // Fallback to old behavior for backwards compatibility
          const entityElement = document.querySelector(
            `[data-entity-id="${entityId}"]`
          );
          if (entityElement) {
            // Scroll to entity with smooth animation
            entityElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });

            // Add highlight class directly since we can't access the Svelte component instance
            // Remove any existing highlights first
            document.querySelectorAll(".entity-highlighted").forEach((el) => {
              el.classList.remove("entity-highlighted");
            });

            // Add highlight class with a slight delay for better visual feedback
            setTimeout(() => {
              entityElement.classList.add("entity-highlighted");
            }, 50);

            // Remove highlight after 3 seconds
            setTimeout(() => {
              entityElement.classList.remove("entity-highlighted");
            }, 3000);
          }
        }
      }
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      handleInteraction(event);
    }
  }
</script>

<div class="component-card">
  <span class="text-entity-secondary font-medium">{componentType}</span>
  <div
    class="text-gray-400 ml-2 text-[12px] component-data"
    onclick={handleInteraction}
    onkeydown={handleKeydown}
    role="button"
    tabindex="0"
  >
    {@html formattedData}
  </div>
</div>

<style>
  :global(.component-data .entity-ref) {
    @apply entity-ref;
  }

  :global(.component-data .entity-ref.active) {
    @apply bg-entity-primary/60 text-white scale-90;
  }
</style>
