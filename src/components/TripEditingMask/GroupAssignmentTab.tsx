import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Trash2, Bus, Car } from 'lucide-react';
import type { Trip, TransportGroup, BusTransport } from '../../types';
import { useTrips } from '../../hooks';

interface GroupAssignmentTabProps {
  trip: Trip;
}

export function GroupAssignmentTab({ trip }: GroupAssignmentTabProps) {
  const { t } = useTranslation('trips');
  const { createTransportGroup, deleteTransportGroup, updateTransportGroup } = useTrips();
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [showAddGroup, setShowAddGroup] = useState(false);

  const departures = trip.trip_departures || [];
  const currentDeparture = departures[0];
  const groups = currentDeparture?.transport_groups || [];
  const transports = trip.bus_transports || [];

  const handleCreateGroup = async () => {
    if (!currentDeparture || !newGroupLabel.trim()) return;

    await createTransportGroup(currentDeparture.id, newGroupLabel, groups.length);
    setNewGroupLabel('');
    setShowAddGroup(false);
  };

  if (!currentDeparture) {
    return (
      <div className="p-6">
        <div className="card">
          <p className="text-gray-400">{t('tripData.noDepartures')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            {t('groups.title')}
          </h3>
          <button
            onClick={() => setShowAddGroup(true)}
            className="btn-primary text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            {t('groups.addGroup')}
          </button>
        </div>

        {showAddGroup && (
          <div className="mb-4 p-3 bg-gray-700 rounded-lg">
            <label className="block text-sm text-gray-400 mb-2">
              {t('groups.groupLabel')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGroupLabel}
                onChange={(e) => setNewGroupLabel(e.target.value)}
                placeholder={t('groups.groupLabel')}
                className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                autoFocus
              />
              <button
                onClick={handleCreateGroup}
                className="btn-primary"
              >
                {t('actions.save')}
              </button>
              <button
                onClick={() => {
                  setShowAddGroup(false);
                  setNewGroupLabel('');
                }}
                className="btn-ghost"
              >
                {t('actions.cancel')}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {groups.length === 0 ? (
            <p className="text-gray-400 text-sm">{t('groups.noGroups')}</p>
          ) : (
            groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                transports={transports}
                onDelete={() => deleteTransportGroup(group.id)}
                onUpdate={updateTransportGroup}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface GroupCardProps {
  group: TransportGroup;
  transports: BusTransport[];
  onDelete: () => void;
  onUpdate: (id: string, updates: Partial<TransportGroup>) => Promise<void>;
}

function GroupCard({ group, transports, onDelete, onUpdate }: GroupCardProps) {
  const { t } = useTranslation('trips');
  const { addTransportToGroup, removeTransportFromGroup } = useTrips();
  const [editMode, setEditMode] = useState(false);
  const [label, setLabel] = useState(group.label);

  const handleSave = async () => {
    await onUpdate(group.id, { label });
    setEditMode(false);
  };

  const assignedTransportIds = new Set(
    group.transport_group_members?.map((m) => m.bus_transport_id) || []
  );

  const assignedTransports = transports.filter((t) =>
    assignedTransportIds.has(t.id)
  );

  const availableTransports = transports.filter(
    (t) => !assignedTransportIds.has(t.id)
  );

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          {editMode ? (
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white"
            />
          ) : (
            <h4 className="font-semibold text-white">{group.label}</h4>
          )}
        </div>
        <div className="flex gap-2">
          {!editMode ? (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="text-gray-400 hover:text-white text-sm"
              >
                {t('actions.edit')}
              </button>
              <button
                onClick={onDelete}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setLabel(group.label);
                  setEditMode(false);
                }}
                className="text-gray-400 hover:text-white text-sm"
              >
                {t('actions.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="text-teal-400 hover:text-teal-300 text-sm"
              >
                {t('actions.save')}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h5 className="text-sm font-medium text-gray-400 mb-2">
            {t('groups.assignedTransports')} ({assignedTransports.length})
          </h5>
          {assignedTransports.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('groups.noTransportsInGroup')}</p>
          ) : (
            <div className="space-y-2">
              {assignedTransports.map((transport) => (
                <TransportItem
                  key={transport.id}
                  transport={transport}
                  action={
                    <button
                      onClick={() => removeTransportFromGroup(group.id, transport.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      {t('groups.removeFromGroup')}
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </div>

        {availableTransports.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-gray-400 mb-2">
              {t('groups.availableTransports')} ({availableTransports.length})
            </h5>
            <div className="space-y-2">
              {availableTransports.map((transport) => (
                <TransportItem
                  key={transport.id}
                  transport={transport}
                  action={
                    <button
                      onClick={() => addTransportToGroup(group.id, transport.id)}
                      className="text-teal-400 hover:text-teal-300 text-sm"
                    >
                      {t('groups.addToGroup')}
                    </button>
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TransportItemProps {
  transport: BusTransport;
  action: React.ReactNode;
}

function TransportItem({ transport, action }: TransportItemProps) {
  const { t } = useTranslation('trips');
  const TypeIcon = transport.unterart === 'PKW' ? Car : Bus;

  return (
    <div className="flex items-center justify-between bg-gray-600 rounded p-2">
      <div className="flex items-center gap-2">
        <TypeIcon className="w-4 h-4 text-teal-400" />
        <div>
          <p className="text-white text-sm font-medium">{transport.text}</p>
          <div className="flex gap-2">
            <span className="text-xs text-gray-400">
              {transport.richtung === 'HIN' ? t('transports.outbound') : t('transports.return')}
            </span>
            <span className="text-xs text-gray-400">
              {transport.unterart === 'PKW' ? t('transports.car') : t('transports.bus')}
            </span>
          </div>
        </div>
      </div>
      {action}
    </div>
  );
}
