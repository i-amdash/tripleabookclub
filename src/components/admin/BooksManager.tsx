'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Book, BookCategory } from '@/types/database.types'
import { Button, Modal, Input, Textarea, Skeleton, CloudinaryUpload } from '@/components/ui'
import { getMonthName } from '@/lib/utils'
import toast from 'react-hot-toast'

export function BooksManager() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    const { data } = await supabase
      .from('books')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    setBooks((data as Book[]) || [])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return

    const { error } = await supabase.from('books').delete().eq('id', id)

    if (error) {
      toast.error('Failed to delete book')
      return
    }

    setBooks(books.filter((b) => b.id !== id))
    toast.success('Book deleted')
  }

  const handleEdit = (book: Book) => {
    setEditingBook(book)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingBook(null)
    setShowModal(true)
  }

  const handleSubmit = async (formData: {
    title: string
    author: string
    synopsis: string
    image_url: string | null
    category: BookCategory
    month: number
    year: number
  }) => {
    setIsSubmitting(true)

    try {
      if (editingBook) {
        const { error } = await supabase
          .from('books')
          .update(formData)
          .eq('id', editingBook.id)

        if (error) throw error

        setBooks(books.map((b) => (b.id === editingBook.id ? { ...b, ...formData } : b)))
        toast.success('Book updated')
      } else {
        const { data, error } = await supabase
          .from('books')
          .insert({ ...formData, is_selected: true })
          .select()
          .single()

        if (error) throw error

        setBooks([data as Book, ...books])
        toast.success('Book added')
      }

      setShowModal(false)
    } catch (error) {
      toast.error('Failed to save book')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Manage Books</h2>
        <Button onClick={handleAdd} leftIcon={<Plus className="w-4 h-4" />}>
          Add Book
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 card">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No books yet. Add your first book!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {books.map((book) => (
            <div key={book.id} className="card flex items-center gap-4">
              <div className="w-16 h-20 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                {book.image_url ? (
                  <img
                    src={book.image_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white/20" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{book.title}</h3>
                <p className="text-sm text-white/60">{book.author}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      book.category === 'fiction'
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'bg-accent-500/20 text-accent-400'
                    }`}
                  >
                    {book.category}
                  </span>
                  <span className="text-xs text-white/40">
                    {getMonthName(book.month)} {book.year}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(book)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(book.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-white/60 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBook ? 'Edit Book' : 'Add Book'}
        size="lg"
      >
        <BookForm
          book={editingBook}
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  )
}

interface BookFormProps {
  book: Book | null
  onSubmit: (data: {
    title: string
    author: string
    synopsis: string
    image_url: string | null
    category: BookCategory
    month: number
    year: number
  }) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

function BookForm({ book, onSubmit, onCancel, isSubmitting }: BookFormProps) {
  const [title, setTitle] = useState(book?.title || '')
  const [author, setAuthor] = useState(book?.author || '')
  const [synopsis, setSynopsis] = useState(book?.synopsis || '')
  const [imageUrl, setImageUrl] = useState(book?.image_url || '')
  const [category, setCategory] = useState<'fiction' | 'non-fiction'>(book?.category || 'fiction')
  const [month, setMonth] = useState(book?.month || new Date().getMonth() + 1)
  const [year, setYear] = useState(book?.year || new Date().getFullYear())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !author.trim() || !synopsis.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    onSubmit({
      title: title.trim(),
      author: author.trim(),
      synopsis: synopsis.trim(),
      image_url: imageUrl.trim() || null,
      category,
      month,
      year,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Book title"
      />

      <Input
        label="Author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="Author name"
      />

      <Textarea
        label="Synopsis"
        value={synopsis}
        onChange={(e) => setSynopsis(e.target.value)}
        placeholder="Brief description of the book"
      />

      <CloudinaryUpload
        label="Cover Image"
        value={imageUrl}
        onChange={setImageUrl}
        resourceType="image"
        folder="tripleabookclub/books"
      />

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label-text">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as 'fiction' | 'non-fiction')}
            className="input-field"
          >
            <option value="fiction">Fiction</option>
            <option value="non-fiction">Non-Fiction</option>
          </select>
        </div>

        <div>
          <label className="label-text">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="input-field"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {getMonthName(i + 1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-text">Year</label>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            min={2020}
            max={2030}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {book ? 'Update' : 'Add'} Book
        </Button>
      </div>
    </form>
  )
}
