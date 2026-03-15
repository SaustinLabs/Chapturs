'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import { MagnifyingGlassIcon, ShieldCheckIcon, UserCircleIcon } from '@heroicons/react/24/outline'

interface User {
  id: string
  name: string
  username: string
  email: string
  role: string
  image: string
  _count: { works: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/users?q=${query}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.data.users)
      }
    } catch (e) {
      console.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(fetchUsers, 500)
    return () => clearTimeout(timeout)
  }, [query])

  const updateRole = async (userId: string, role: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role })
      })
      if (res.ok) fetchUsers()
    } catch (e) {
      console.log('Update failed')
    }
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">User Registry</h1>
          <div className="relative w-96">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-full border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-all shadow-inner"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">User</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Status/Role</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Activity</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <img src={user.image || 'https://www.gravatar.com/avatar?d=mp'} className="w-12 h-12 rounded-2xl bg-gray-100 object-cover" />
                        <div>
                          <p className="font-black text-gray-900 dark:text-white leading-none mb-1">{user.name || 'Anonymous'}</p>
                          <p className="text-sm text-gray-500 leading-none">@{user.username || 'user'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        user.role === 'admin' ? 'bg-red-100 text-red-600' :
                        user.role === 'moderator' ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm">
                      <p className="font-bold text-gray-900 dark:text-white">{user._count.works} Works</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="inline-flex space-x-2">
                        <select
                          className="text-xs font-bold bg-transparent border-none focus:ring-0 cursor-pointer text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                          value={user.role}
                          onChange={e => updateRole(user.id, e.target.value)}
                        >
                          <option value="user">USER</option>
                          <option value="moderator">MODERATOR</option>
                          <option value="admin">ADMIN</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
