<template>
  <div id="app">
    <GraphicEditor />
  </div>
</template>

<script>
import GraphicEditor from '@/components/GraphicEditor'
export default {
  name: 'App',
  components: {
    GraphicEditor
  }
}
</script>

<style>
body {
  margin: 0;
}
div,
p,
dd,
th,
td {
  margin: 0;
  padding: 0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  height: 100vh;
}
</style>
