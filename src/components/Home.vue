<script setup>
import { useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import { useSignOut, useUserId } from '@nhost/vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { gql } from '@apollo/client/core'

const router = useRouter()

const userId = useUserId()

const newNote = ref({
  title: '',
  content: ''
})

const { loading: notesLoading, result: notesResult, error, refetch: notesRefetch } = useQuery(gql`
    query ($userId: String!) {
      notes (
        order_by: { created: desc},
        where: { user_id: { _eq: $userId }}
      ) {
        id,
        title,
        content,
        created
      }
    }
  `, {
    userId: userId.value
  })

  const {
    mutate: createNote,
    onDone: createNoteDone
  } = useMutation(gql`
    mutation ($userId: String!, $title: String!, $content: String!) {
      insert_notes_one(object: {
        content: $content, 
        title: $title, 
        user_id: $userId
        }) {
          id
        }
    }
  `)

//function that checks if fields are filled and then creates a new note
const handleCreateNote = () => {
  if (!newNote.value.title || !newNote.value.content) {
    return alert('Please fill in all fields')
  }

//this creates a new note in the database
  createNote({
    userId: userId.value,
    title: newNote.value.title,
    content: newNote.value.content
  })
}

//this reloads all notes when a new note is created and displays the new note
//without needing to page refresh
  createNoteDone(() => {
    notesRefetch()
    newNote.value = {
      title: '',
      content: ''
    }
  })

//this deletes a note from the database
const { mutate: deleteNote, onDone: deleteDone } = useMutation(gql`
  mutation ($id: Int!) {
    delete_notes(where: { id: { _eq: $id}}) {
      affected_rows
    }
  }
`)

//this refreshes the notes when a note is delete
deleteDone(() => {
  notesRefetch()
})


//converts graphql timestamp to a readable date
const convertToDate = date => {
  return new Date(date).toLocaleString()
} 

//makes possible to add new lines when creating notes
const convertToHTML = (content) => {
  return content.replace(/\n/g, '<br>')
}

//signs out the user in the button
const { signOut } = useSignOut()
const handleSignOut = async (e) => {
  e.preventDefault()
  await signOut()
  router.push('/login')
}
//end of script
</script>


<template>
  <main>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold">My Notes app</h1>
      <button @click="handleSignOut" class="text-red-500 hover:underline cursor-pointer">Logout</button>
    </div>

    <form @submit.prevent="handleCreateNote" class="mb-8">
      <label class="block mb-4">
        <span class="block text-sm uppercase mb-2">Title</span>
            <input 
                type="text" 
                v-model="newNote.title" 
                placeholder="What's the title" 
                class="block w-full text-slate-800 px-4 py-2"/>
      </label>

      <label class="block mb-4">
        <span class="block text-sm uppercase mb-2">Content</span>
            <textarea 
                type="text" 
                v-model="newNote.content" 
                placeholder="Write your content" 
                class="block w-full text-slate-800 px-4 py-2">
            </textarea>
      </label>

      <input 
            type="submit" 
            value="Create note" 
            class="text-green-500 hover:underline cursor-pointer">
    </form>

    <div v-if="!notesLoading">
      <div v-for="note in notesResult.notes" :key="note.id"
      class="relative bg-white text-slate-700 rounded-lg p-6 mb-6">

      <button @click="() => deleteNote({id: note.id})" class="absolute text-red-500 top-3 right-4 font-bold">Delete</button>

      <h3 class="font-bold text-2xl mb-4">{{ note.title }}</h3>
      <p v-html="convertToHTML(note.content)" class="text-lg text-gray-500 mb-4"></p>
      <div class="text-sm text-gray-500 italic">{{ convertToDate(note.created) }}</div>
      </div>
    </div>
  </main>
</template>
